const { createClient } = require('@supabase/supabase-js');
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
    { targetEmail: 'agente3@imobiliaria.com', newEmail: 'emilio@ahut.com.br', name: 'Emílio', role: 'agent', dept: 'Financeiro' },
    { targetEmail: 'agente1@imobiliaria.com', newEmail: 'angel@ahut.com.br', name: 'Angel', role: 'agent', dept: 'Comercial' },
    { targetEmail: 'agente2@imobiliaria.com', newEmail: 'joyce@ahut.com.br', name: 'Joyce', role: 'agent', dept: 'Comercial' },
    { targetEmail: 'agente4@imobiliaria.com', newEmail: 'denisse@ahut.com.br', name: 'Denisse', role: 'agent', dept: 'Comercial' }
  ];

  for (const u of updates) {
    let { data: usersData, error: err } = await supabase.auth.admin.listUsers();
    let targetUser = usersData.users.find(x => x.email === u.targetEmail || x.email === u.newEmail);
    
    // Some emails might have been updated already if this script was partially run
    if (!targetUser) {
       console.log(`Could not find user with email ${u.targetEmail} or ${u.newEmail}`);
       continue;
    }

    console.log(`Updating auth for ${targetUser.email} -> ${u.newEmail}`);
    const { data: updatedAuth, error: authErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
      email: u.newEmail,
      email_confirm: true,
      ...(u.password ? { password: u.password } : {})
    });
    if (authErr) { console.error('Error updating auth:', authErr.message); continue; }

    const { error: profileErr } = await supabase.from('profiles').update({
      full_name: u.name,
      email: u.newEmail,
      role: u.role,
      department_id: deptMap[u.dept]
    }).eq('id', targetUser.id);
    if (profileErr) console.error('Error updating profile:', profileErr.message);
  }

  console.log('Creating Rodrigo Sacramento (Admin)...');
  let { data: usersData } = await supabase.auth.admin.listUsers();
  let rodrigo = usersData.users.find(x => x.email === 'sacramento@apexfyhub.com.br');
  if (!rodrigo) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: 'sacramento@apexfyhub.com.br',
      password: 'Tech@2709',
      email_confirm: true
    });
    if (error) console.error('Error creating Rodrigo:', error.message);
    else rodrigo = created.user;
  }
  if (rodrigo) {
    await supabase.from('profiles').update({
      full_name: 'Rodrigo Sacramento',
      role: 'admin',
      department_id: deptMap['Tecnologia']
    }).eq('id', rodrigo.id);
  }
  
  console.log('Done!');
}
run();
