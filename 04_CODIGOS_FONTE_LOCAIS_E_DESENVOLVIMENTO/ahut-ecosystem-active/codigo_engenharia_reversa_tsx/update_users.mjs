import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ptochsyoyatsydfysacc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2Noc3lveWF0c3lkZnlzYWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MzQzNSwiZXhwIjoyMDg0NDE5NDM1fQ.P9niQoD_8jFl5W30mGSV8bVMQtND1JEnlu_5QIzaR-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const departments = [
  'Tecnologia', 'Diretoria', 'Gestão', 'Supervisor Comercial', 
  'Jurídico', 'Administrativo', 'Financeiro', 'Comercial'
];

async function run() {
  console.log('Ensuring departments exist...');
  const deptMap = {};
  for (const dept of departments) {
    let { data: existing } = await supabase.from('departments').select('id, name').eq('name', dept).maybeSingle();
    if (!existing) {
      const { data: created } = await supabase.from('departments').insert({ name: dept }).select().single();
      existing = created;
    }
    deptMap[dept] = existing.id;
  }
  console.log('Departments:', deptMap);

  const updates = [
    { targetEmail: 'jota@imobiliaria.com', newEmail: 'jota@ahut.com', name: 'Jota', role: 'admin', dept: 'Diretoria' },
    { targetEmail: 'chloe@imobiliaria.com', newEmail: 'chloe@ahut.com', name: 'Chloe', role: 'admin', dept: 'Diretoria' },
    { targetEmail: 'chris@imobiliaria.com', newEmail: 'chris@apexfyhub.com.br', name: 'Chris Racanelli', role: 'admin', dept: 'Gestão', password: 'Dhinatos@124!' },
    { targetEmail: 'igor@imobiliaria.com', newEmail: 'igor@ahut.com', name: 'Igor', role: 'manager', dept: 'Supervisor Comercial' },
    { targetEmail: 'wesadvogadosassociados@gmail.com', newEmail: 'wesadvogadosassociados@gmail.com', name: 'Willhan', role: 'agent', dept: 'Jurídico', password: 'Willhanhut123$' },
    { targetEmail: 'karina@ahut.com.br', newEmail: 'Luciana@ahut.com.br', name: 'Luciana', role: 'agent', dept: 'Administrativo' },
    // Need to handle "Agente 3", "Agente 1", etc. Their emails might not be "agente3@imobiliaria.com". Let's match by name if possible, or target the emails we know.
    { nameMatch: 'Emilio', newEmail: 'emilio@ahut.com.br', name: 'Emilio', role: 'agent', dept: 'Financeiro' },
    { nameMatch: 'Angel', newEmail: 'angel@ahut.com.br', name: 'Angel', role: 'agent', dept: 'Comercial' },
    { nameMatch: 'Joyce', newEmail: 'joyce@ahut.com.br', name: 'Joyce', role: 'agent', dept: 'Comercial' },
    { nameMatch: 'Denisse', newEmail: 'denisse@ahut.com.br', name: 'Denisse', role: 'agent', dept: 'Comercial' }
  ];

  const { data: profilesData, error: profErr } = await supabase.from('profiles').select('id, full_name, email');
  if (profErr) { console.error('Error fetching profiles', profErr); return; }

  for (const u of updates) {
    let targetProfile = null;
    if (u.targetEmail) {
      targetProfile = profilesData.find(x => x.email === u.targetEmail || x.email === u.newEmail);
    } else if (u.nameMatch) {
      targetProfile = profilesData.find(x => x.full_name && x.full_name.includes(u.nameMatch));
    }
    
    if (!targetProfile) {
       console.log(`Could not find profile for ${u.targetEmail || u.nameMatch}`);
       continue;
    }

    console.log(`Updating auth for ${u.newEmail}`);
    const { data: updatedAuth, error: authErr } = await supabase.auth.admin.updateUserById(targetProfile.id, {
        email: u.newEmail,
        email_confirm: true,
        ...(u.password ? { password: u.password } : {})
    });
    if (authErr) console.error('Error updating auth:', authErr.message);

    console.log(`Updating profile for ${targetProfile.full_name}`);
    const { error: profileErr } = await supabase.from('profiles').update({
      full_name: u.name,
      email: u.newEmail,
      role: u.role,
      department_id: deptMap[u.dept]
    }).eq('id', targetProfile.id);
    if (profileErr) console.error('Error updating profile:', profileErr.message);
  }

  console.log('Creating/Updating Rodrigo Sacramento (Admin)...');
  let rodrigoProfile = profilesData.find(x => x.email === 'sacramento@apexfyhub.com.br');
  if (!rodrigoProfile) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: 'sacramento@apexfyhub.com.br',
      password: 'Tech@2709',
      email_confirm: true
    });
    if (error) console.error('Error creating Rodrigo:', error.message);
    else {
      // Need to create the profile manually if not handled by trigger, but there's probably a trigger. Wait, let's just update the profile.
      await supabase.from('profiles').update({
        full_name: 'Rodrigo Sacramento',
        role: 'admin',
        department_id: deptMap['Tecnologia']
      }).eq('id', created.user.id);
    }
  } else {
    // Ensure password is correct
    await supabase.auth.admin.updateUserById(rodrigoProfile.id, { password: 'Tech@2709' });
    await supabase.from('profiles').update({
      full_name: 'Rodrigo Sacramento',
      role: 'admin',
      department_id: deptMap['Tecnologia']
    }).eq('id', rodrigoProfile.id);
  }
  
  console.log('Done!');
}
run();
