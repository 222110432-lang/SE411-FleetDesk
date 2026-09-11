import { teamMembers } from '../src/data/team.js'
import { existsSync } from 'node:fs'

const errors = []
// Validate the actual team supplied by the user. The original brief's three-person
// wording and the two-person team are both recorded in docs/requirements.md.
if (teamMembers.length !== 2) errors.push('The user-confirmed team consists of two students.')
teamMembers.forEach((member, index) => {
  if (!member.name.trim()) errors.push(`Team member ${index + 1}: full name is missing.`)
  if (!member.studentId.trim()) errors.push(`Team member ${index + 1}: student ID is missing.`)
})
const ids = teamMembers.map((member) => member.studentId.trim()).filter(Boolean)
if (new Set(ids).size !== ids.length) errors.push('Student IDs must be unique.')
for (const path of [
  'README.md',
  'docs/requirements.md',
  'docs/architecture.md',
  'docs/code-review.md',
  'docs/testing.md',
  'docs/test-results.json',
]) {
  if (!existsSync(path)) errors.push(`Required project evidence is missing: ${path}`)
}
if (errors.length) {
  console.error('Submission is not complete:\n' + errors.map((error) => `- ${error}`).join('\n'))
  process.exitCode = 1
} else
  console.log(
    'Both team identities and required project files are present. The brief specifies three students; this version records the user-confirmed two-person team. This local check does not verify GitHub publication. The team will handle course submission.',
  )
