import paramiko, urllib.parse, re, urllib.request, json, sys, uuid, datetime

"""
Utilitario do JARVIS para resolver incidente de audio — REENVIO PARA PRODUCAO.
Uso: python3 preparar_reenvio.py <conversation_id> <audio_url> <tenant_id> [destino_opcional]

Resolve o destinatario REAL do cliente (whatsapp_contacts.remote_jid / numero) e
cria whatsapp_message no formato correto [Audio] nome.ogg\n<URL> (URL em linha separada
para virar PTT, nao texto). Se <destino> for informado, direciona para ele.
"""
pwd = urllib.parse.unquote('Dir@5207411605')

def main():
    if len(sys.argv) < 4:
        print("uso: preparar_reenvio.py <conv_id> <audio_url> <tenant_id> [destino_opcional]")
        return 1
    conv, audio_url, tenant = sys.argv[1], sys.argv[2], sys.argv[3]
    dest_override = sys.argv[4] if len(sys.argv) > 4 else ''

    cli = paramiko.SSHClient()
    cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    cli.connect('2.24.95.98', username='root', password=pwd, timeout=15)
    sftp = cli.open_sftp()
    env = sftp.open('/root/crmahut/backend-broker/.env').read().decode()
    sftp.close()
    m = re.search(r'SUPABASE_SERVICE_ROLE_KEY=\s*"?([^\s";]+)"?', env)
    mu = re.search(r'SUPABASE_URL=\s*"?([^\s";]+)"?', env)
    if not m or not mu:
        print("ERRO: credenciais nao encontradas"); return 1
    key = m.group(1).strip('"')
    url = mu.group(1).strip('"')

    def api_get(path):
        req = urllib.request.Request(url + '/rest/v1/' + path,
            headers={'apikey': key, 'Authorization': f'Bearer {key}'})
        return json.loads(urllib.request.urlopen(req, timeout=15).read().decode())

    # 1) resolve o destino real
    remote_jid = dest_override
    if not remote_jid:
        try:
            wc = api_get(f'whatsapp_contacts?select=remote_jid,remote_jid_alt,phone_number&conversation_id=eq.{conv}&limit=1')
            if wc and wc[0]:
                c = wc[0]
                remote_jid = c.get('remote_jid')
                if not remote_jid:
                    alt = (c.get('remote_jid_alt') or '').replace('@lid', '').replace('@s.whatsapp.net', '')
                    ph = (c.get('phone_number') or '').replace('@lid', '').replace('@s.whatsapp.net', '')
                    num = alt or ph
                    if num: remote_jid = num + '@s.whatsapp.net'
        except Exception as e:
            print("aviso resolvendo contato:", str(e)[:60])
    if not remote_jid:
        try:
            cv = api_get(f'conversations?select=client_id,client:client_id(phone)&id=eq.{conv}&limit=1')
            if cv and cv[0].get('client'):
                ph = cv[0]['client'][0].get('phone') or ''
                if ph: remote_jid = ph.replace('@lid','').replace('@s.whatsapp.net','') + '@s.whatsapp.net'
        except Exception:
            pass
    if not remote_jid:
        print("ERRO: nao resolveu destino real da conversa", conv); return 1
    if '@' not in remote_jid:
        remote_jid = remote_jid + '@s.whatsapp.net'

    # 2) sessao connected do tenant
    try:
        sess = api_get(f'whatsapp_sessions?select=id&tenant_id=eq.{tenant}&status=eq.connected&limit=1')
        if not sess:
            print("ERRO: sem sessao connected"); return 1
        session_id = sess[0]['id']
    except Exception as e:
        print("ERRO sessao:", str(e)[:80]); return 1

    name = audio_url.split('/')[-1] or 'audio.ogg'
    content = f"[Audio] {name}\n{audio_url}"
    mid = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    body = {
        "id": mid, "tenant_id": tenant, "whatsapp_session_id": session_id, "remote_jid": remote_jid,
        "from_me": True, "message_type": "audio", "content": content, "status": "pending",
        "processing_status": "pending", "media_status": "none", "retry_count": 0,
        "created_at": now, "updated_at": now,
    }
    req2 = urllib.request.Request(url + '/rest/v1/whatsapp_messages', method='POST',
        data=json.dumps(body).encode(),
        headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json',
                 'Prefer': 'return=representation'})
    try:
        r = urllib.request.urlopen(req2, timeout=15)
        created = json.loads(r.read().decode())
        print(f"REENVIO criado p/ {remote_jid} | id={mid[:8]} | formato correto")
        print("DESTINO REAL:", remote_jid)
        print("content len:", len(content))
        cli.close()
        return 0
    except urllib.error.HTTPError as e:
        print("ERRO reenvio:", e.code, e.read().decode()[:200])
        return 1

if __name__ == "__main__":
    sys.exit(main())