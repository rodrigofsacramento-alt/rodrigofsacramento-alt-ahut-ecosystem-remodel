const fs = require('fs');

async function run() {
  const url = 'https://ptochsyoyatsydfysacc.supabase.co/rest/v1';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2Noc3lveWF0c3lkZnlzYWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MzQzNSwiZXhwIjoyMDg0NDE5NDM1fQ.P9niQoD_8jFl5W30mGSV8bVMQtND1JEnlu_5QIzaR-4';
  
  const headers = {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json'
  };

  const rawList = `
| Adriana Coelho | - |
| Adriano Cavitione | - |
| Agência Hut (Admin) | - |
| Ana Carla | - |
| Ana Souza | - |
| Anderson Lago | - |
| Ary | - |
| Chloe Parra Financeiro | +595 983 441757 |
| Claudemir | - |
| D'Paula | - |
| David | - |
| Denise Neves | - |
| Denisse Burgos | - |
| Eduardo Caballero | - |
| Eduardo Napoleao | - |
| Elias Marcelo Romero Britos | - |
| Emmanuel Beítez | - |
| Erick Kretschmer | - |
| Evandro Bragança | - |
| Ever Cubilla | - |
| Fabrício Ody | - |
| Fatima de Souza Amorin | - |
| Fátima Del Carmen Servián Lugo | - |
| Félix Moisés Aquino Ramírez | - |
| Fernando Centurión | - |
| Filipe Seolin | - |
| Fiorella Mazzuchini | - |
| Florencia Bianchetti Müller | - |
| Franciele Camargo | - |
| Francisco Conceicao da Silva | - |
| Fredy González | - |
| Gian Gonzalez | - |
| Gilberto Braga | - |
| Giliardi Meldola | - |
| Gilson alto Padrão | - |
| Giuliana Ayelen Penayo | - |
| Guillermo Ivan Gonzalez | - |
| Horst Lohse | - |
| Isabela Galindo Solaeche | - |
| Ivan | - |
| Ivaneide Pereira | - |
| Jazmin Ojeda | - |
| Jazmín Del Rosário Garay Crosta | - |
| Jazmilla Ferreira | - |
| Jocimar Pessoal (Admin) | - |
| Juliano Sandin | - |
| Lu Administrativo | - |
| Lucio Langendorf | +55 48 9919-5018 |
| Milena Silva De Cerqueira | - |
| Omar Bradley | - |
| Paula | - |
| Paulo Gilvanio Moreira | - |
| Rafael vinicius | +55 62 8153-9040 |
| Rodrigo Alborno | - |
| Sandra | - |
| Sistema Hut - Suporte | +55 11 98819-2658 |
| Suelen Stefanny Vieira | - |
| wesley | - |
  `;

  // Parse names
  const lines = rawList.trim().split('\n');
  const names = [];
  for (const line of lines) {
     const match = line.match(/\| (.*?) \|/);
     if (match && match[1]) {
        let name = match[1].trim();
        // Remove "(Admin)"
        name = name.replace('(Admin)', '').trim();
        names.push(name);
     }
  }

  const groupId = '120363429270420536'; 
  const participantRecords = [];

  for (const name of names) {
     let leadId = null;
     let contactId = null;
     let phone = null;
     let participantName = name;

     // Search leads
     const encodedName = encodeURIComponent('%' + name + '%');
     const leadRes = await fetch(url + '/leads?name=ilike.' + encodedName, { headers });
     const leads = await leadRes.json();
     if (leads && leads.length > 0) {
        leadId = leads[0].id;
        phone = leads[0].phone;
        participantName = leads[0].name;
     } else {
        // Search whatsapp_contacts
        const contactRes = await fetch(url + '/whatsapp_contacts?pushName=ilike.' + encodedName, { headers });
        const contacts = await contactRes.json();
        if (contacts && contacts.length > 0) {
           contactId = contacts[0].id;
           phone = contacts[0].remoteJid;
           participantName = contacts[0].pushName || name;
        }
     }

     // Build record if found
     if (leadId || contactId) {
        // Find if this group exists in conversations first
        // Wait, group_participants schema might just be conversation_id, lead_id, contact_id, role, etc.
        // Let's just push it.
        participantRecords.push({
           conversation_id: '74ba9c65-0ed5-4986-8216-0f6ad8d1c3e5', // I need the UUID of the group conversation!
           name: participantName,
           lead_id: leadId,
           contact_id: contactId,
           is_admin: false,
           phone_number: phone
        });
     }
  }
  
  console.log('Found ' + participantRecords.length + ' matched participants out of ' + names.length);
  fs.writeFileSync('participants_to_insert.json', JSON.stringify(participantRecords, null, 2));
}

run();
