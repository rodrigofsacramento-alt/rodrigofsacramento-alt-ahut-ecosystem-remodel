# 🗑️ SISTEMA DE LIXEIRA — SOFT DELETE DE PERFIS

## Como usar

### Mover perfil para lixeira (em vez de DELETE)
```sql
SELECT move_profile_to_trash('uuid-do-perfil-aqui');
```

### Restaurar perfil da lixeira
```sql
SELECT restore_from_trash('uuid-do-perfil-aqui');
```

### Ver o que está na lixeira
```sql
SELECT id, full_name, phone, deleted_at, deleted_by FROM deleted_profiles ORDER BY deleted_at DESC;
```

## Tabela: `deleted_profiles`
Herda todas as colunas de `profiles` + adiciona:
- `deleted_at` — quando foi deletado
- `deleted_by` — quem/qual bot deletou
- `restore_data` — JSON com conversas, WhatsApp contacts e mensagens relacionadas

## Funções criadas

| Função | Descrição |
|---|---|
| `move_profile_to_trash(UUID)` | Move profile + relacionamentos para lixeira |
| `restore_from_trash(UUID)` | Restaura profile da lixeira |

## Histórico
- 171 LIDs foram **hard-deleted** antes da criação da lixeira (26/08/2026) — irrecuperáveis
- 1 LID do Rodrigo Sacramento foi hard-deleted — irrecuperável
- **Próximas exclusões usarão soft delete** via `move_profile_to_trash()`