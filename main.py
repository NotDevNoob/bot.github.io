import discord
from discord.ext import commands
import json
import os
import requests

# Definisci il client
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True
intents.reactions = True

client = commands.Bot(command_prefix="!", intents=intents)

# Funzioni per gestire il file JSON
JSON_FILE = "data.json"

def load_data():
    if not os.path.exists(JSON_FILE):
        return []
    with open(JSON_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(JSON_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Classe per gestire i dati persistenti
class PersistentData:
    def __init__(self):
        # Dati degli utenti (puoi sostituire con un database o un file JSON)
        self.user_data = {}
        # Coda degli utenti
        self.queue = []

    def add_user(self, user_id, ign, tier, server, tested=False):
        """Aggiunge un utente ai dati persistenti."""
        self.user_data[user_id] = {
            'ign': ign,
            'tier': tier,
            'server': server,
            'tested': tested,
            'skin_head': None  # Aggiungi l'URL dell'immagine del profilo qui se necessario
        }

    def add_to_queue(self, user_id):
        """Aggiunge un utente alla coda."""
        if user_id not in self.queue:
            self.queue.append(user_id)

    def remove_from_queue(self, user_id):
        """Rimuove un utente dalla coda."""
        if user_id in self.queue:
            self.queue.remove(user_id)

# Crea un'istanza globale di PersistentData
persistent_data = PersistentData()

# Comando !results
@client.event
async def on_message(message):
    if message.content.startswith('!results'):
        # Analizza i parametri
        parts = message.content.split()
        
        try:
            # Estrae i dati dal messaggio
            user_tested = message.mentions[0]
            tier_before = parts[2]
            tier_earned = parts[3].upper()
            ign = ' '.join(parts[4:])  # Supporta nomi Minecraft con spazi
            
            # Validazione tier
            valid_tiers = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"]
            if tier_earned not in valid_tiers:
                return await message.channel.send("❌ Tier non valido! Esempi: HT1, LT3, HT5")

            # Salva i dati
            new_entry = {
                "discord_id": str(user_tested.id),
                "tier_before": tier_before,
                "tier_earned": tier_earned,
                "ign": ign,
                "tester": str(message.author.id),
                "timestamp": str(discord.utils.utcnow())
            }
            data = load_data()
            data.append(new_entry)
            save_data(data)

            # Crea l'embed con colore nero
            embed = discord.Embed(
                title="Risultati Tier Test 🏆",
                color=0x000000  # Colore nero
            )
            embed.add_field(name="IGN", value=ign, inline=False)
            embed.add_field(name="Tier Prima", value=tier_before, inline=True)
            embed.add_field(name="Tier Dopo", value=tier_earned, inline=True)
            embed.add_field(name="Tester", value=message.author.mention, inline=False)

            # Ottieni il canale specifico
            target_channel = client.get_channel(1345515675980140544)
            if target_channel is None:
                return await message.channel.send("❌ Canale non trovato!")

            # Invia il messaggio nel canale specifico
            msg = await target_channel.send(
                content=f"Risultati per {user_tested.mention}:",
                embed=embed
            )
            
            # Aggiungi reazioni
            await msg.add_reaction("👍")
            await msg.add_reaction("👎")

        except IndexError:
            await message.channel.send("**Formato corretto:**\n`!results @utente tier-before tier-earned ign`\nEsempio: `!results @User Unranked HT3 Steve Alex`")
        except Exception as e:
            await message.channel.send(f"❌ Errore: {str(e)}")
    
    await client.process_commands(message)

# Comando !profile
@client.command(name='profile')
async def profile(ctx):
    try:
        user_id = str(ctx.author.id)
        user_info = persistent_data.user_data.get(user_id)

        if not user_info:
            await ctx.send("❌ Non hai completato la verifica!", ephemeral=True)
            return

        # Ottieni l'UUID dall'API di Mojang
        mojang_url = f"https://api.mojang.com/users/profiles/minecraft/{user_info['ign']}"
        response = requests.get(mojang_url)

        if response.status_code != 200:
            await ctx.send(f"❌ Impossibile trovare l'utente Minecraft **{user_info['ign']}**.", ephemeral=True)
            return

        data = response.json()
        player_uuid = data["id"]
        player_name = data["name"]

        # Genera l'URL dell'immagine del profilo
        profile_image_url = f"https://render.crafty.gg/3d/bust/{player_uuid}"

        # Costruisci l'embed
        tier_status = f"{user_info.get('tier', 'Nessuno')}"
        if user_info.get('tested'):
            tier_status += " (Verificato)"
        else:
            tier_status += " (Non verificato)"

        embed = discord.Embed(title="📝 Il tuo profilo", color=0x00ff00)
        embed.add_field(name="IGN", value=user_info['ign'], inline=False)
        embed.add_field(name="Tier", value=tier_status, inline=False)
        embed.add_field(name="Server Preferito", value=user_info.get('server', 'N/D'), inline=False)

        # Aggiungi l'immagine del profilo Minecraft
        embed.set_thumbnail(url=profile_image_url)

        # Aggiungi la posizione in coda
        embed.add_field(name="Posizione in coda", 
                       value=f"#{persistent_data.queue.index(ctx.author.id)+1}" if ctx.author.id in persistent_data.queue else "Non in coda", 
                       inline=False)

        await ctx.send(embed=embed, ephemeral=True)

    except Exception as e:
        await ctx.send(f"❌ Errore: {str(e)}", ephemeral=True)

# Evento on_ready
@client.event
async def on_ready():
    print(f"I'm ready! Logged in as {client.user.name} ({client.user.id}) and go kys nigger {JSON_FILE}")

# Avvia il bot
client.run("MTM0NTUxNjY0MTY1MTI2NTYyNw.GGdrK4.0nLgGF3bS-mNiNgyigCFe_BTU5XKGR-Y3kl6WY")