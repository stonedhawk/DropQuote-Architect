import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(rootDir, 'src', 'data')

const normalizeWordList = (entries) =>
  entries
    .map((entry) => String(entry).trim().toUpperCase())
    .filter((entry) => entry.length >= 3 && /^[A-Z]+$/.test(entry))

const flattenExpectedWordGroups = (groups) => Object.values(groups).flat()

const loadJson = async (filename) => {
  const contents = await readFile(path.join(dataDir, filename), 'utf8')
  return JSON.parse(contents)
}

const main = async () => {
  const [
    gameReadySmall,
    rawDictionary,
    coreWords,
    validWordAdditions,
    playerExpectedWords,
  ] = await Promise.all([
    loadJson('game-ready-small.json'),
    loadJson('dictionary.json'),
    loadJson('core-words.json'),
    loadJson('valid-word-additions.json'),
    loadJson('player-expected-words.json'),
  ])

  const runtimeValidationWords = Array.from(
    new Set(
      normalizeWordList([
        ...gameReadySmall,
        ...rawDictionary,
        ...coreWords,
        ...validWordAdditions,
        ...flattenExpectedWordGroups(playerExpectedWords),
      ]),
    ),
  ).sort()

  await mkdir(dataDir, { recursive: true })
  await writeFile(
    path.join(dataDir, 'valid-gameplay-words.json'),
    `${JSON.stringify(runtimeValidationWords, null, 2)}\n`,
    'utf8',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
