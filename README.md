# DD&D — Dynamic Dungeons & Dragons

Dark fantasy tactical combat com 5 classes, árvore de talentos, maestria infinita e sistema de guildas.

## 🎮 Como jogar

| Input | Ação |
|-------|------|
| **WASD** | Mover |
| **Mouse** | Mirar |
| **Segurar click** | Linha de mira |
| **Soltar click** | Disparar |
| **1 / 2 / 3** | Habilidades |
| **ESC** | Pausar |

## ⚔️ Classes

| Classe | Perfil | Passiva |
|--------|--------|---------|
| 🟢 **Hunter** | Ranged, flechas tipadas | Aljava Mística — 9 flechas (veneno/stun/lacerante) |
| 🔴 **Berserker** | Melee, fúria por ataques | Fúria Crescente — +5% dano por stack |
| 🟣 **Runekeeper** | Caster, runas e invocações | Ressonância Rúnica — +15% dano por runa adjacente |
| 🔵 **Riftblade** | Assassino, manipulação espacial | Distorção Espacial — +40% dano pós-teleporte |
| 🟡 **Trickster** | Caótico, ilusões e clones | Improviso — 5ª skill free a cada 4 usadas |

Cada classe tem **15 habilidades** em 4 ramos (Core, Ofensivo, Utilitário, Avançado) + **maestria infinita**.

## 🛠️ Stack

- **Client:** Phaser 3.90 + TypeScript + Vite
- **Server:** Express + JWT + MongoDB Atlas
- **Multiplayer:** Colyseus (planejado)

## 🚀 Setup

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com sua MONGODB_URI e JWT_SECRET

# Rodar em dev (client + server)
pnpm dev

# Ou rodar separados:
pnpm dev:client  # Vite na porta 3000
pnpm dev:server  # Express na porta 4000
```

## 📁 Estrutura

```
client/              Frontend (Phaser)
├── scenes/          Boot, Login, Menu, ClassSelect, Game, HUD, Tutorial, TalentTree, Guild
├── services/        Auth API, Game API
└── systems/         Quiver, Textures, WaveManager, Constants, ClassGameplay

server/              Backend (Express)
├── auth.ts          Login, Register, Profile (JWT)
├── game.ts          Save runs, XP, History
├── guild.ts         CRUD guildas
└── db.ts            MongoDB connection

shared/              Tipos e dados compartilhados
├── types.ts         PlayerProfile, ClassDef, Mastery
└── classes/         Hunter, Berserker, Runekeeper, Riftblade, Trickster
```

## 📜 Licença

Projeto pessoal — todos os direitos reservados.
