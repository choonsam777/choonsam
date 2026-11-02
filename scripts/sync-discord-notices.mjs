import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const output = new URL('../notices.json', import.meta.url)

export function messagesToNotices(messages, guildId, channelId) {
  return messages
    .filter(message => message && (message.type === 0 || message.type === 19))
    .map(message => {
      const embedText = (message.embeds || []).flatMap(embed => [
        embed.title,
        embed.description,
        ...(embed.fields || []).map(field => `${field.name}: ${field.value}`)
      ]).filter(Boolean)
      const body = [message.content, ...embedText].filter(Boolean).join('\n').trim()
      if (!body) return null
      const firstLine = body.split(/\r?\n/).find(line => line.trim() && !/^@(everyone|here)$/i.test(line.trim())) || '공지'
      const author = message.member?.nick || message.author?.global_name || message.author?.username || '춘삼마을'
      const timestamp = message.timestamp || ''
      return {
        id: message.id,
        source: 'discord',
        title: firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').slice(0, 90),
        body: body.slice(0, 8000),
        author: String(author).slice(0, 60),
        date: timestamp.slice(0, 10),
        timestamp,
        link: guildId ? `https://discord.com/channels/${guildId}/${channelId}/${message.id}` : ''
      }
    })
    .filter(Boolean)
    .slice(0, 20)
}

async function discordGet(path, token) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${token}`, 'User-Agent': 'ChunsamVillageLauncher/1.0' }
  })
  if (!response.ok) throw new Error(`Discord API 오류: HTTP ${response.status}. 봇 권한과 채널 ID를 확인하세요.`)
  return response.json()
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_CHANNEL_ID
  if (!token || !channelId) {
    console.log('Discord 봇 토큰 또는 공지 채널 ID가 아직 설정되지 않았습니다. 기존 공지를 유지합니다.')
    return
  }
  if (!/^\d{17,20}$/.test(channelId)) throw new Error('DISCORD_CHANNEL_ID 형식이 올바르지 않습니다.')
  const [channel, messages] = await Promise.all([
    discordGet(`/channels/${channelId}`, token),
    discordGet(`/channels/${channelId}/messages?limit=50`, token)
  ])
  if (!Array.isArray(messages)) throw new Error('Discord 메시지 응답 형식이 올바르지 않습니다.')
  if (messages.length === 0) {
    console.log('공지 채널에 메시지가 없습니다. 기존 공지를 유지합니다.')
    return
  }
  const notices = messagesToNotices(messages, channel.guild_id, channelId)
  if (messages.length > 0 && notices.length === 0) {
    throw new Error('공지 내용을 읽지 못했습니다. 봇의 Message Content Intent와 채널 읽기 권한을 확인하세요.')
  }
  const json = `${JSON.stringify(notices, null, 2)}\n`
  const previous = await readFile(output, 'utf8').catch(() => '')
  if (previous !== json) {
    await writeFile(output, json)
    console.log(`Discord 공지 ${notices.length}개를 갱신했습니다.`)
  } else {
    console.log(`Discord 공지 ${notices.length}개, 변경 없음.`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
