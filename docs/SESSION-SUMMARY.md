# DD&D — Resumo da Sessão de Desenvolvimento

> Dynamic Dungeons & Dragons — Sessão 27/Nov/2026

## 🎯 Visão Geral

Jogo tático top-down com 5 classes, 75 habilidades, sistema de maestria infinita, árvore de talentos e dois modos de jogo (Arena e Dungeon). Stack: **Phaser 3.90 + TypeScript + Vite + Express + MongoDB Atlas**.

---

## 📦 O Que Foi Construído (Repositório: DD-and-D)

### Infraestrutura
- Repositório Git com 25+ commits no main
- Backend Express na porta 4000 com JWT auth (bcrypt)
- MongoDB Atlas (cluster "Bulwark", DB `ddd`)
- Client Phaser na porta 3001 via Vite
- 10 cenas registradas no Phaser

### Sistema de Classes (5 classes × 15 habilidades = 75 total)
- **Hunter** — foco em ataque básico, aljava de 9 flechas tipadas
- **Berserker** — tanque melee, fúria acumulada
- **Runekeeper** — caster, runas e invocações
- **Riftblade** — assassino melee, manipulação espacial
- **Trickster** — caótico, ilusões, melee + ranged fraco (híbrido)

### Todas as 75 habilidades implementadas e funcionais
- Cada habilidade tem VFX visual (circles, tweens, screen shake)
- Helpers: `aoeHit()`, `aoeDirectional()`, `findNearestEnemy()`
- Habilidades como Arcane Singularity (black hole), Chain Lightning (5 targets), Reality Shatter (tela inteira), Chaos Roulette (efeito random)

### Sistema de Progressão
- **Nível Global**: XP acumulado, escala cúbica, cosmético
- **Maestria por Classe**: infinita, 7 faixas (Sem Faixa → Grão-Mestre), bônus de dano/HP/cooldown
- **Skills desbloqueáveis por maestria**: 5 por classe em M2/M5/M8/M12/M20
- **Gold**: ganho em runs, gasto em desbloqueios (T1=100g, T2=250g, T3=500g)
- **5 skills core desbloqueadas por padrão** por classe

### Árvore de Talentos (Redesenhada)
- Nodes com **apenas ícone** — tooltip hover mostra nome/descrição/CD
- 4 branches: Core, Ofensivo, Utilitário, Avançado
- **Barra de equip** no fundo (5 slots, keys 1-5)
- Click para equipar/desequipar + drag & drop
- **Sem restrição de branch** — mistura livre
- Tier dots coloridos + glow dourado nos equipados
- Sincroniza com servidor

### Modo Arena
- Ondas infinitas com escala progressiva
- ESC entre ondas → pausa com opção RETIRADA TÁTICA (salva progresso)
- ESC durante onda → pausa com CONTINUAR
- Game over salva XP/gold/maestria no servidor

### Modo Dungeon (Implementado nesta sessão)
- Mapa procedural: 7-10 salas, 5×5 grid, caminho até boss
- 6 tipos de sala: spawn, combat, elite, boss, treasure, rest
- Inimigos escalados por andar (+30% HP, +20% dmg por floor)
- **Boss**: 5×+floor HP, 2× dmg, escala 1.8×, tint roxo
- Sala limpa → volta ao mapa de dungeon
- Boss derrotado → tela DUNGEON COMPLETA! com stats
- ESC → "VOLTAR AO MAPA" (diferente da arena)

### Visual (Polido nesta sessão)
- **Loading**: shimmer animado, runas pulsantes, barra refinada
- **Login**: inputs com focus dourado, circles decorativos
- **Menu**: botões com hover scale, descrições, runas animadas
- **HUD**: glass panels, 5 ability slots com key badges, HP pulse
- **Tipografia**: Cinzel (headings) + Inter (body)
- **Paleta**: #07070c background, #c9a44e gold, hierarquia de cinzas

### Ataques por Classe
| Classe | Tipo | Detalhes |
|--------|------|----------|
| Hunter | Ranged | Projétil com aljava de 9 flechas |
| Berserker | Melee | Arco 60°, 50px range, 600ms |
| Runekeeper | Rune (ranged) | Projétil lento, 200px range |
| Riftblade | Melee | Arco rápido, 80px range, 500ms |
| Trickster | Híbrido | Melee 70px + projétil fraco (12 dmg) |

---

## 🐛 Bugs Corrigidos

| Bug | Causa Raiz | Fix |
|-----|-----------|-----|
| ESC trava o jogo | `scene.pause()` bloqueava input+timers | `physics.pause()` + flag `paused` |
| Abilities perdidas ao voltar | `this.abilities` não resetado no create | `this.abilities = []` no início do create |
| Flechas paradas no arqueiro | `setVelocity` antes de `group.add()` | `group.add()` antes de `setVelocity()` |
| "Classe bloqueada" ao desbloquear | Contas antigas sem `unlocked: true` | Removida verificação + migração no boot |
| Starters não apareciam na árvore | Profile local desatualizado | Force `unlocked.add()` dos starters no client |
| Dungeon não funcionava | game-scene ignorava dados de dungeon | init() aceita dungeonMode + lógica completa |

---

## 📁 Arquivos Principais

### Client (12 arquivos)
- `client/scenes/game-scene.ts` — 2700+ linhas, gameplay completo
- `client/scenes/talent-tree-scene.ts` — árvore redesenhada com equip bar
- `client/scenes/class-select-scene.ts` — seleção com mastery borders
- `client/scenes/dungeon-map-scene.ts` — mapa procedural clicável
- `client/scenes/main-menu-scene.ts` — menu polido com runas
- `client/scenes/hud-scene.ts` — glass HUD com 5 slots
- `client/systems/class-gameplay.ts` — config de ataque por classe (melee/ranged/hybrid)
- `client/systems/dungeon.ts` — gerador procedural de dungeon

### Server (5 arquivos)
- `server/main.ts` — Express + migração de contas legacy
- `server/auth.ts` — register/login, 5 starters por classe
- `server/game.ts` — save-run, mastery, global level
- `server/class-progress.ts` — unlock/equip endpoints
- `server/guild.ts` — CRUD de guilds

### Shared (6 arquivos)
- `shared/types.ts` — tipos, mastery tiers, XP formulas
- `shared/classes/*.ts` — 5 definições de classe com 15 abilities cada

---

## 🔮 Próximos Passos Potenciais
- Sprites de personagem (procedural pixel art ou assets open-source)
- Passivas de classe implementadas no gameplay
- Sistema de mana
- Multiplayer (Colyseus)
- Mais andares de dungeon com temas
- Balanceamento de habilidades
- Sistema de loot/itens
