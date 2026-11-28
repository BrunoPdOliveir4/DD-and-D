# DD&D — Character Concept Bible

> Documento de design visual e narrativo das 5 classes jogáveis

---

## 🏹 HUNTER — O Caçador Preciso

### Identidade
O Hunter é o mestre do controle de campo à distância. Sua mecânica central — a **aljava mística** — define seu ritmo de jogo: 9 flechas tipadas (veneno, stun, lacerante) em ordem aleatória, forçando adaptação constante. Não é um sniper estático; é um predador em movimento que combina mobilidade com tiros calculados.

### Visual Sugerido
- **Silhueta**: Esguio, ágil. Capuz leve que deixa o rosto parcialmente visível.
- **Cores**: Verdes florestais (#2ecc71) com detalhes marrons. A aljava brilha sutilmente com a cor da próxima flecha.
- **Elementos**: Arco recurvo nas costas, aljava lateral com flechas coloridas visíveis, braçadeira no antebraço, capa curta rasgada.
- **Animação idle**: Toques leves na aljava, verificando flechas. Leve oscilação da capa.
- **Escala**: Médio-leve. Menor que Berserker, maior que Trickster.

### Passiva: Aljava Mística
9 flechas tipadas (3🟢veneno, 3🔵stun, 3🔴lacerante) em ordem aleatória. Após disparar todas, 4s de recarga. Habilidades não gastam flechas.

### Stats Base
| HP | Speed | Defense | Damage | Atk Speed | Range |
|----|-------|---------|--------|-----------|-------|
| 850 | 170 | 8 | 40 | 1.2 | 280 |

### Skills (15) — 4 Branches

**Core (identidade)**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Chuva de Flechas 🏹 | T1 | AoE marcada no chão, dano em área |
| Recarga Rápida ⚡ | T1 | Recarrega 4 flechas instantaneamente |
| Olho de Águia 🦅 | T2 | +alcance +velocidade por 5s, flechas perfuram |
| Presa Marcada 🎯 | T2 | Marca alvo por 8s, +30% dano contra ele |

**Ofensivo (burst/DPS)**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Flecha Perfurante 💎 | T1 | Longo alcance, ignora armadura, atravessa |
| Flecha Explosiva 💥 | T2 | Explode no impacto, AoE + pushback |
| Disparo Triplo 🔱 | T2 | 3 flechas em leque, cada uma gasta da aljava |
| Explosão de Veneno ☠️ | T3 | Detona veneno acumulado, dano massivo |

**Utilitário (CC, mobilidade)**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Recuo Ágil 💨 | T1 | Dash traseiro + tiro automático |
| Armadilha de Urso 🪤 | T1 | Root 2.5s + dano no trigger |
| Camuflagem 🌿 | T2 | Invisível 3s, primeiro ataque +50% |
| Instinto Selvagem 🐺 | T3 | +50% atk speed por 6s |

**Avançado (poder puro)**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Tempestade de Flechas 🌪️ | T2 | 20 flechas em 360° |
| Flecha Rastreadora 🏹 | T2 | Projétil teleguiado, 55 dmg |
| Rajada Final 💥 | T3 | Rapid-fire 8 flechas em sequência |

### Filosofia de Gameplay
> "O ataque básico define, as skills complementam."

O Hunter joga ao redor da aljava. Suas habilidades abrem janelas para maximizar o valor de cada flecha. Um bom Hunter sabe quando usar Olho de Águia para perfurar, quando plantar Armadilha para criar espaço, e quando guardar Chuva de Flechas para a wave de elites.

---

## ⚔️ BERSERKER — O Tanque Furioso

### Identidade
Pura agressão melee. O Berserker cresce em poder conforme luta — sua passiva **Fúria Crescente** recompensa combate contínuo. É o front-liner que absorve dano e devolve multiplicado. Quanto mais perto da morte, mais perigoso fica.

### Visual Sugerido
- **Silhueta**: Largo, musculoso, postura agressiva. O maior sprite do jogo.
- **Cores**: Vermelhos intensos (#e74c3c) com detalhes de ferro/cinza. Veias vermelhas brilham quando em Fúria alta.
- **Elementos**: Machado duplo enorme, armadura pesada parcial (peito/ombros, abdômen exposto com cicatrizes), correntes quebradas nos pulsos, olhos com brilho vermelho.
- **Animação idle**: Respira pesado, aperta os punhos. Machado descansa no ombro.
- **Efeito passiva**: Aura vermelha crescente a cada stack de Fúria (glow intensifica).
- **Escala**: O maior. 1.3× do tamanho padrão.

### Passiva: Fúria Crescente
Ataques sequenciais acumulam Fúria (+5% dano por stack, max 10). Perde stacks após 3s sem atacar.

### Stats Base
| HP | Speed | Defense | Damage | Atk Speed | Range |
|----|-------|---------|--------|-----------|-------|
| 1100 | 160 | 12 | 55 | 1.5 | 50 |

### Skills (15) — 4 Branches

**Core**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Arremesso de Machado 🪓 | T1 | Machado que atordoa 1s e retorna |
| Grito de Guerra 📢 | T1 | +30% atk speed 5s, repele próximos |
| Sede de Sangue 🩸 | T2 | Próximos 5 ataques curam 15% do dano |
| Golpe Furioso 💢 | T2 | Slam AoE proporcional à fúria |

**Ofensivo**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Cleave ⚔️ | T1 | Arco que atinge todos à frente |
| Execução 💀 | T2 | Dano massivo se alvo <30% HP |
| Redemoinho 🌪️ | T2 | Spin AoE por 3s, pode se mover |
| Frenesi 🔥 | T3 | Cada kill em 6s = +15% dano acumulativo |

**Utilitário**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Investida 🏃 | T1 | Dash em linha reta, empurra inimigos |
| Pele de Ferro 🛡️ | T1 | -50% dano recebido por 3s |
| Intimidar 😤 | T2 | Inimigos fogem 2s, +20% dano neles |
| Imortal 💪 | T3 | Sobrevive com 1 HP, invulnerável 2s |

**Avançado**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Fúria do Berserker 🔴 | T2 | +40% dano, +20% speed, -30% defesa, 8s |
| Terremoto 🌋 | T2 | Shockwave 360°, stun 1.5s |
| Avatar de Guerra 👹 | T3 | Dobra de tamanho, +100% dano, +50% HP, 10s |

### Filosofia de Gameplay
> "O ataque básico define, as skills potencializam a agressão."

O Berserker entra e não sai. Suas habilidades sustentam a agressão: Grito de Guerra para engajar, Sede de Sangue para sustain, Pele de Ferro para sobreviver spikes. Avatar de Guerra é o momento "deus da guerra" — um all-in de 10s onde tudo morre ou você morre.

---

## 🔮 RUNEKEEPER — O Mago Estrategista

### Identidade
Controlador de campo. O Runekeeper não é sobre reações rápidas — é sobre **planejamento**. Suas runas colocadas no chão criam zonas de poder. A passiva **Ressonância Rúnica** recompensa posicionamento inteligente: runas próximas se fortalecem mutuamente.

### Visual Sugerido
- **Silhueta**: Esbelto, encapuzado, postura contemplativa. Mãos brilhando com runas.
- **Cores**: Roxos profundos (#9b59b6) com brilhos arcanos azulados. Runas flutuantes ao redor.
- **Elementos**: Cajado longo com cristal no topo, manto pesado com símbolos rúnicos bordados (brilham sutilmente), grimório preso ao cinto, capuz profundo com olhos brilhantes.
- **Animação idle**: Runas orbitam lentamente ao redor. Mão gesticulando traçando símbolos no ar.
- **Efeito passiva**: Linhas de energia conectam runas adjacentes no chão (brilho crescente).
- **Escala**: Médio. Padrão.

### Passiva: Ressonância Rúnica
Runas colocadas próximas ressoam entre si: +15% dano por runa adjacente (raio 150px). Max 3 runas ativas.

### Stats Base
| HP | Speed | Defense | Damage | Atk Speed | Range |
|----|-------|---------|--------|-----------|-------|
| 700 | 150 | 6 | 30 | 0.8 | 200 |

### Skills (15) — 4 Branches

**Core**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Runa de Gelo ❄️ | T1 | Runa que explode, congela 2s |
| Runa de Fogo 🔥 | T1 | Coluna de fogo, DoT 3s |
| Invocar Golem 🗿 | T2 | Pet tanque por 8s |
| Escudo Rúnico 🛡️ | T2 | Absorve 200 dmg, explode ao quebrar |

**Ofensivo**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Projétil Arcano ✨ | T1 | Projétil teleguiado |
| Runa Armadilha 🪤 | T2 | Runa invisível, detona ao pisar |
| Relâmpago em Cadeia ⚡ | T2 | Salta entre 5 inimigos |
| Meteoro ☄️ | T3 | Queda após 2s, AoE massivo + queimadura |

**Utilitário**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Teleporte Rúnico 🌀 | T1 | Teleporte + slow onde estava |
| Drenar Mana 💜 | T1 | Reduz cooldowns em 2s |
| Invocar Wisp 🧚 | T2 | Pet que cura 5% HP/s por 6s |
| Distorção Temporal ⏳ | T3 | Slow 60% em área por 4s |

**Avançado**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Sobrecarga Rúnica 💥 | T2 | Próximas 3 runas detonam instant +50% |
| Fusão Elemental 🌈 | T2 | Gelo+fogo combo: congela e queima |
| Singularidade Arcana 🕳️ | T3 | Black hole que puxa inimigos 4s, explode |

### Filosofia de Gameplay
> "As skills definem tudo. Posicionamento é poder."

O Runekeeper joga o tabuleiro inteiro. Coloca Runa de Gelo na rota de fuga, Runa de Fogo no chokepoint, Runa Armadilha no flanco. A Ressonância Rúnica transforma o campo de batalha numa rede de morte. Meteor é o "fechar a porta" — 2s de telegraph seguido de destruição total.

---

## ⚡ RIFTBLADE — O Assassino Dimensional

### Identidade
Manipulador espacial e burst assassin. O Riftblade entra, executa, e sai antes que percebam. Sua passiva **Distorção Espacial** recompensa combos de teleporte+ataque. É o carry de single-target — mata o alvo prioritário antes que a luta comece.

### Visual Sugerido
- **Silhueta**: Atlético, postura alerta. Leve inclinação para frente como um predador prestes a saltar.
- **Cores**: Azuis elétricos (#3498db) com traços de vazio/roxo escuro. Partículas dimensionais flutuam ao redor.
- **Elementos**: Duas lâminas curtas (tipo kama/sickle) com brilho dimensional, armadura leve tipo ninja-tech, faixas que flutuam como se afetadas por gravidade zero, olhos com brilho azul/vazio.
- **Animação idle**: Distorções espaciais cintilam ao redor. Uma mão segura lâmina, outra faz gesto de rasgar o espaço.
- **Efeito passiva**: Flash dimensional após teleporte — aura de dano amplificado visível.
- **Escala**: Médio. Ligeiramente menor que Berserker.

### Passiva: Distorção Espacial
Após usar habilidade de teleporte, próximo ataque causa +40% dano e tem alcance dobrado. 4s de janela.

### Stats Base
| HP | Speed | Defense | Damage | Atk Speed | Range |
|----|-------|---------|--------|-----------|-------|
| 750 | 190 | 7 | 65 | 1.0 | 80 |

### Skills (15) — 4 Branches

**Core**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Golpe Dimensional ⚡ | T1 | Teleporta atrás do alvo + ataque crítico |
| Marca do Vazio 🎯 | T1 | Marca inimigo, +80% dano no próximo ataque |
| Fase Dimensional 👻 | T2 | Intangível 1.5s, pode mover mas não atacar |
| Fenda Espacial 🌀 | T2 | Portal de entrada/saída por 10s |

**Ofensivo**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Lâmina Sombria 🗡️ | T1 | Projétil rápido + reduz defesa 4s |
| Erupção do Vazio 💥 | T2 | Detona todas as Marcas ativas, AoE massivo |
| Assalto de Clones 👥 | T2 | 3 clones atacam em sequência (40% dmg cada) |
| Corte Dimensional ✂️ | T3 | Corta o espaço em linha, ignora toda defesa |

**Utilitário**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Passo Sombrio 💨 | T1 | Dash + decoy que atrai ataques 2s |
| Âncora Dimensional ⚓ | T1 | Marca posição, reativar teleporta + cura 20% |
| Poço Gravitacional 🌑 | T2 | Puxa inimigos para centro 2s + slow |
| Rebobinar ⏪ | T3 | Volta posição e HP de 3s atrás |

**Avançado**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Assassinar ☠️ | T2 | Kill instantâneo se marcado + <25% HP |
| Dimensão Espelho 🪞 | T2 | Arena isolada com 1 inimigo, +50% dano 5s |
| Estilhaçar Realidade 💎 | T3 | Dano a TODOS os inimigos na tela |

### Filosofia de Gameplay
> "Manipulação espacial + burst. Entra, mata, sai."

O Riftblade é o carry. Marca o Vazio no alvo prioritário, Golpe Dimensional para teleportar atrás, combo amplificado pela passiva (+40%), Erupção do Vazio para AoE se necessário. Rebobinar é o "undo" para quando erra o timing. Assassinar é a execução perfeita — mas exige setup.

---

## 🎪 TRICKSTER — O Palhaço do Caos

### Identidade
Imprevisível e caótico. O Trickster não tem a melhor DPS nem o melhor CC — mas tem o kit mais versátil e divertido. Sua passiva **Improviso** recompensa rotação de habilidades: a cada 4 usadas, a próxima é grátis. É o "fun factor" do jogo.

### Visual Sugerido
- **Silhueta**: Ágil, assimétrico. Postura exagerada, como um performer de circo.
- **Cores**: Dourados/laranjas (#f39c12) com roxo escuro. Cores vivas e contrastantes.
- **Elementos**: Máscara de meia-face (sorriso de um lado, neutro do outro), roupas de bufão estilizadas (não cômicas — mais "sinistro medieval"), cartas de baralho flutuando ao redor, frascos no cinto, facas escondidas nas mangas.
- **Animação idle**: Faz truque de carta, flipando entre dedos. Olhar travesso para a câmera.
- **Efeito passiva**: Contador visual (1-4) acima da cabeça. No 4, brilho dourado explode.
- **Escala**: O menor. Ágil e compacto.

### Passiva: Improviso
A cada 4 habilidades usadas, a próxima tem cooldown zerado e custo zero. Contador visual no HUD.

### Stats Base
| HP | Speed | Defense | Damage | Atk Speed | Range |
|----|-------|---------|--------|-----------|-------|
| 680 | 200 | 5 | 35 | 1.3 | 120 |

### Ataque Básico: HÍBRIDO
- **Melee**: Arco de ataque corpo a corpo (70px range, como facada rápida)
- **Ranged**: Simultaneamente dispara projétil fraco (12 dmg) — representa uma faca arremessada
- **Filosofia**: Perto ele é decente, longe ele faz cosquinha. Precisa das skills pra funcionar.

### Skills (15) — 4 Branches

**Core**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Malabarismo 🤹 | T1 | 3 bolas ricocheteiam entre inimigos |
| Espelho de Fumaça 🪞 | T1 | Clone ilusório 4s, explode ao acabar |
| Truque de Cartas 🃏 | T2 | 5 cartas em leque, efeito aleatório cada |
| Desaparecer 💨 | T2 | Invisível 3s, +60% dano ao revelar |

**Ofensivo**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Frasco de Veneno 🧪 | T1 | Poça de veneno 4s, DoT + slow |
| Confete Explosivo 🎉 | T2 | AoE + confusão 2s (movem aleatório) |
| Chuva de Facas 🔪 | T2 | 8 facas em área circular |
| Grand Finale 🎆 | T3 | Combo massivo, dano escala com skills usadas |

**Utilitário**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Cambalhota 🤸 | T1 | Roll com i-frames, curto cooldown |
| Troca 🔄 | T1 | Troca posição com inimigo, stun 1s |
| Show de Marionetes 🎭 | T2 | Controla inimigo por 3s |
| Moeda da Sorte 🪙 | T3 | Cara: cura 25% HP. Coroa: +50% dano 5s |

**Avançado**
| Skill | Tier | Descrição |
|-------|------|-----------|
| Salão de Espelhos 🏰 | T2 | 4 clones copiam skills com 30% dano, 6s |
| Roleta do Caos 🎰 | T2 | Habilidade ALEATÓRIA (AoE/heal/speed/clones) |
| Última Cortina 🎪 | T3 | Stage lights + 90 dmg a TODOS os inimigos |

### Filosofia de Gameplay
> "As skills definem tudo. Caos controlado."

O Trickster é a classe mais "game feel" — cada partida é diferente. Truque de Cartas tem efeito aleatório por carta, Roleta do Caos pode dar qualquer coisa, Moeda da Sorte é 50/50 entre heal ou damage. A passiva Improviso recompensa usar tudo rápido: 4 skills → 1 grátis → loop. Grand Finale escala com momentum.

---

## 📊 Comparativo de Classes

| Aspecto | Hunter | Berserker | Runekeeper | Riftblade | Trickster |
|---------|--------|-----------|------------|-----------|-----------|
| **Role** | DPS Ranged | Tank/Melee DPS | Controller/Caster | Burst Assassin | Chaos/Utility |
| **Ataque** | Ranged (arco) | Melee (machado) | Ranged (runa) | Melee (lâminas) | Híbrido |
| **HP** | 850 | 1100 | 700 | 750 | 680 |
| **Dano Base** | 40 | 55 | 30 | 65 | 35 |
| **Velocidade** | 170 | 160 | 150 | 190 | 200 |
| **Defesa** | 8 | 12 | 6 | 7 | 5 |
| **Dificuldade** | ⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Melhor em** | Sustain DPS | Sobrevivência | Controle de área | Eliminar alvos | Adaptação |
| **Fraqueza** | Sem escape forte | Lento, kitable | Frágil, setup lento | Sem sustain | Dano inconsistente |
| **Passiva** | Aljava Mística | Fúria Crescente | Ressonância Rúnica | Distorção Espacial | Improviso |

---

## 🎨 Diretrizes Visuais Gerais

### Tom
- **Dark fantasy medieval** com toques de magia. Não é cartoon, não é ultra-realista.
- Referências: Hades (estilização), Slay the Spire (iconografia), Diablo IV (atmosfera).

### Paleta
- Background: `#07070c` (negro profundo)
- Gold accent: `#c9a44e` (dourado envelhecido)
- Cada classe tem cor primária que permeia tudo (tints, auras, projéteis, UI)

### Animações Mínimas Viáveis (procedural)
Mesmo sem sprites detalhados, cada classe se diferencia visualmente por:
1. **Cor** — vermelho/verde/roxo/azul/dourado
2. **Tamanho** — Berserker > padrão > Trickster
3. **Partículas** — tipo e cor dos efeitos ao redor
4. **Ataque** — arco melee vs projétil vs zona vs híbrido
5. **Habilidades** — VFX único por skill (já implementado com 75 skills)
