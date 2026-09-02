#!/bin/bash
# Detector: sinaliza quando há incidente de áudio pendente p/ o JARVIS resolver.
# O worker grava AUDIO_FAIL_REPORTED no audit_logs. Este script detecta novos
# / pendentes nas últimas 1-2 min e aciona o JARVIS a resolver (auditar+reenviar p/ Rodrigo).
# Se nada pendente recente, sai vazio (silencioso).
/opt/data/ssh-venv/bin/python3 - << 'PYEOF'
import paramiko, urllib.parse, re, urllib.request, json, datetime, hashlib
pwd = urllib.parse.unquote('Dir@5207411605')
try:
    cli = paramiko.SSHClient(); cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    cli.connect('2.24.95.98', username='root', password=pwd, timeout=12)
    sftp = cli.open_sftp(); env = sftp.open('/root/crmahut/backend-broker/.env').read().decode(); sftp.close()
    key = re.search(r'SUPABASE_SERVICE_ROLE_KEY=\s*"?([^\s";]+)"?', env).group(1).strip('"')
    url = re.search(r'SUPABASE_URL=\s*"?([^\s";]+)"?', env).group(1).strip('"')
    # incidentes REPORTED recentes (últimos 120s) de qualquer conversa
    req = urllib.request.Request(url+'/rest/v1/audit_logs?select=action,resource_id,metadata,created_at&action=eq.AUDIO_FAIL_REPORTED&order=created_at.desc&limit=10',
        headers={'apikey':key,'Authorization':f'Bearer {key}'})
    logs = json.loads(urllib.request.urlopen(req, timeout=12).read().decode())
    now = datetime.datetime.now(datetime.timezone.utc)
    recentes = []
    for l in logs:
        try:
            t = datetime.datetime.fromisoformat(l['created_at'].replace('Z','+00:00'))
            if (now - t).total_seconds() < 120 and 'AUDIO_FAIL_RESOLVED' not in str(l.get('metadata')):
                # apenas se ainda pendente (buscar se já há RESOLVED para esta conversa)
                recentes.append(l)
        except: pass
    if recentes:
        for l in recentes:
            md = json.dumps(l.get('metadata',{}), ensure_ascii=False)
            print(f"INCIDENTE_PARA_JARVIS conversa_id={l.get('resource_id')} ts={l['created_at']} md={md[:120]}")
        print("HASH", hashlib.md5(json.dumps(recentes, ensure_ascii=False).encode()).hexdigest()[:12])
    cli.close()
except Exception:
    pass
PYEOF