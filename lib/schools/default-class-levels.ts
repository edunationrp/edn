export type SchoolTypeKey = 'primaire' | 'secondaire' | 'lycee' | 'universite' | 'formation'

export function getDefaultClassLevelNames(schoolType: string): string[] {
  switch (schoolType as SchoolTypeKey) {
    case 'primaire':
      return ['CP', 'CE1', 'CE2', 'CM1', 'CM2']
    case 'secondaire':
      return ['6ème', '5ème', '4ème', '3ème']
    case 'lycee':
      return ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle']
    case 'universite':
      return ['L1', 'L2', 'L3', 'M1', 'M2']
    case 'formation':
      return ['Niveau 1', 'Niveau 2', 'Niveau 3']
    default:
      return ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle']
  }
}
