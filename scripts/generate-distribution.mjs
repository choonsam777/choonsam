import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../', import.meta.url)
const repo = 'https://raw.githubusercontent.com/choonsam777/choonsam/main'
const server = JSON.parse(await readFile(new URL('server.json', root), 'utf8'))
const modsDir = new URL('mods/', root)
const names = (await readdir(modsDir)).filter(name => name.toLowerCase().endsWith('.jar')).sort()
const seen = new Set()
const mods = []
for (const name of names) {
  if (!/^[\w.+-]+\.jar$/i.test(name)) throw new Error(`모드 파일 이름에는 영문, 숫자, 점, 밑줄, 하이픈만 사용하세요: ${name}`)
  const slug = name.slice(0, -4).toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  if (seen.has(slug)) throw new Error(`모드 이름이 중복됩니다: ${name}`)
  seen.add(slug)
  const bytes = await readFile(new URL(`mods/${name}`, root))
  const md5 = createHash('md5').update(bytes).digest('hex')
  mods.push({
    id: `choonsam.mods:${slug}:${md5.slice(0, 12)}`,
    name,
    type: 'FabricMod',
    required: { value: true },
    artifact: {
      size: bytes.length,
      MD5: md5,
      path: name,
      url: `${repo}/mods/${encodeURIComponent(name)}?v=${md5}`
    }
  })
}

const distribution = {
  version: '1.0.0',
  servers: [{
    id: 'ChunsamVillage-26.3',
    name: server.name,
    description: server.description,
    icon: `${repo}/icon.png`,
    version: '1.0.0',
    address: server.address,
    minecraftVersion: '26.3',
    mainServer: true,
    autoconnect: server.autoconnect,
    javaOptions: { supported: '>=25.x', suggestedMajor: 25, distribution: 'TEMURIN' },
    modules: [{
      id: 'net.fabricmc:fabric-loader:0.20.1',
      name: 'Fabric Loader 0.20.1',
      type: 'Fabric',
      artifact: {
        size: 1988880,
        MD5: '2e3dc8eebfde75fc8078c931090cd46f',
        url: 'https://maven.fabricmc.net/net/fabricmc/fabric-loader/0.20.1/fabric-loader-0.20.1.jar'
      },
      subModules: [{
        id: 'fabric-loader-0.20.1-26.3',
        name: 'Fabric 26.3 profile',
        type: 'VersionManifest',
        artifact: {
          size: 2778,
          MD5: '26a4f84daf580a7f84f20286a349c70c',
          url: `${repo}/fabric/fabric-loader-0.20.1-26.3.json`
        }
      }]
    }, ...mods]
  }]
}
await writeFile(new URL('distribution.json', root), `${JSON.stringify(distribution, null, 2)}\n`)
console.log(`배포 목록 생성 완료: 모드 ${mods.length}개`)
