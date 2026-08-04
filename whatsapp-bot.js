require('dotenv').config({ path: '.env.local' });
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL or Service Key is missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startBot() {
  console.log('🔄 Initializing WhatsApp Bot connection...');
  
  // Use multi-file authentication state to persist sessions
  const { state, saveCreds } = await useMultiFileAuthState('whatsapp_session');

  // Create WASocket instance
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }), // Hide detailed library logs
    auth: state,
    printQRInTerminal: false // We will handle printing with qrcode-terminal for formatting
  });

  // Save credentials on updates
  sock.ev.on('creds.update', saveCreds);

  // Monitor connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n--- SCAN THIS QR CODE WITH WHATSAPP ---');
      qrcode.generate(qr, { small: true });
      console.log('----------------------------------------\n');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`⚠️ Connection closed. Status Code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        setTimeout(() => startBot(), 5000); // Wait 5 seconds before reconnecting
      } else {
        console.log('❌ Logged out of WhatsApp. Delete "whatsapp_session" directory and restart to scan again.');
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Bot successfully connected and listening for messages!');
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return; // Ignore empty/system messages
    if (msg.key.fromMe) return; // Ignore self messages

    const senderJid = msg.key.remoteJid;
    if (senderJid.endsWith('@g.us')) return; // Ignore group messages (only handle DM/personal chat)

    const senderNumber = senderJid.split('@')[0];
    const last10Digits = senderNumber.slice(-10);

    // Extract message text content
    const messageText = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''
    ).trim();

    if (!messageText) return;

    console.log(`📩 Message from ${senderNumber}: "${messageText}"`);

    try {
      let students = [];
      let isDirectQuery = false;
      let queryType = '';

      // Check if user is searching by name/diary page number explicitly
      const lowerText = messageText.toLowerCase();
      if (lowerText.startsWith('fee ') || lowerText.startsWith('fees ')) {
        isDirectQuery = true;
        const queryParts = messageText.split(/\s+/);
        queryParts.shift(); // Remove the "fee" or "fees" word
        const queryText = queryParts.join(' ').trim();

        if (queryText) {
          queryType = queryText;
          if (/^\d+$/.test(queryText)) {
            // If it is numeric, query by diary_page_number
            console.log(`🔍 Querying by Diary Page Number: ${queryText}`);
            const { data, error } = await supabase
              .from('student_fee_summary')
              .select('*')
              .eq('diary_page_number', queryText);
            
            if (error) throw error;
            students = data || [];
          } else {
            // Else query by student name (case-insensitive, partial match)
            console.log(`🔍 Querying by Name: ${queryText}`);
            const { data, error } = await supabase
              .from('student_fee_summary')
              .select('*')
              .ilike('name', `%${queryText}%`);
            
            if (error) throw error;
            students = data || [];
          }
        }
      }

      // If it wasn't a direct query, or if direct query returned nothing, search by phone number
      if (!isDirectQuery || students.length === 0) {
        if (!isDirectQuery) {
          console.log(`🔍 Querying by Mobile: ${last10Digits}`);
          const { data, error } = await supabase
            .from('student_fee_summary')
            .select('*')
            .like('mobile', `%${last10Digits}%`);

          if (error) throw error;
          students = data || [];
        }
      }

      // Send Response
      if (students.length > 0) {
        let replyText = `📚 *Ayushman Educational Academy* 📚\n\n`;
        replyText += `Namaste! Aapke dwara pooche gaye student(s) ke details neeche diye gaye hain:\n\n`;

        for (const student of students) {
          const total = Number(student.total_fee) || 0;
          const prevDues = Number(student.previous_dues) || 0;
          const paid = Number(student.total_paid) || 0;
          const remaining = Number(student.remaining_fee) || 0;
          
          let paymentStatus = 'Unpaid';
          if (student.payment_status === 'paid') paymentStatus = '✅ Fully Paid';
          else if (student.payment_status === 'partial') paymentStatus = '🔶 Partially Paid';
          else paymentStatus = '❌ Unpaid';

          replyText += `👨‍🎓 *Student:* ${student.name}\n`;
          replyText += `🏫 *Class:* ${student.class}\n`;
          if (student.diary_page_number) {
            replyText += `📖 *Diary Page No:* ${student.diary_page_number}\n`;
          }
          replyText += `📅 *Academic Year:* ${student.academic_year || '2025-26'}\n\n`;

          replyText += `💰 *Fee Details:*\n`;
          replyText += `• Admission Fee: ₹${total.toLocaleString('en-IN')}\n`;
          if (prevDues > 0) {
            replyText += `• Previous Dues: ₹${prevDues.toLocaleString('en-IN')}\n`;
          }
          const grandTotal = total + prevDues;
          replyText += `• Total Payable: ₹${grandTotal.toLocaleString('en-IN')}\n`;
          replyText += `• Amount Paid: ₹${paid.toLocaleString('en-IN')}\n`;
          replyText += `• *Pending Balance: ₹${remaining.toLocaleString('en-IN')}*\n`;
          replyText += `• *Status:* ${paymentStatus}\n`;
          replyText += `-----------------------------------\n\n`;
        }

        replyText += `⚠️ *Note:* Agar koi galti hai ya aapko koi sawal hai, to kripya School Office se contact karein.`;
        
        await sock.sendMessage(senderJid, { text: replyText });
        console.log(`📤 Fee details sent to ${senderNumber}`);
      } else {
        // Handle search failure or default help message
        let replyText = '';
        if (isDirectQuery) {
          replyText = `❌ Database mein *"${queryType}"* naam ya diary page number ka koi student nahi mila.\n\nKripya spelling check karein ya correct diary page number likhein.`;
        } else {
          replyText = `👋 Namaste! Aapka mobile number (*${last10Digits}*) school database mein registered nahi hai.\n\nAgar aap bache ki fee detail dekhna chahte hain, to kripya niche diye gaye format mein message karein:\n\n👉 *fee [student_name]*\n_Example: fee Ayush_\n\n👉 *fee [diary_page_number]*\n_Example: fee 104_`;
        }
        
        await sock.sendMessage(senderJid, { text: replyText });
        console.log(`📤 Help / Student not found reply sent to ${senderNumber}`);
      }
    } catch (err) {
      console.error('❌ Error handling WhatsApp message:', err);
    }
  });
}

// Start the bot
startBot().catch(err => console.error('❌ Fatal error starting bot:', err));
