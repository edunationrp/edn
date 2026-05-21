Tu es un architecte logiciel senior et développeur full-stack expert en SaaS multi-tenant, plateformes scolaires, sécurité RBAC, Next.js, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase, PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security et déploiement Vercel.

Je veux que tu développes une application web complète appelée “EduNation”.

IMPORTANT :
- Pas d’application mobile pour le moment.
- L’application doit être 100% web responsive : desktop, tablette et mobile web.
- L’application cible les collèges et lycées du Burkina Faso.
- Le MVP exclut : école primaire, résultats officiels BAC/BEPC, statistiques nationales, intégration ministère.
- Le projet doit être propre, moderne, sécurisé, scalable et prêt à devenir un SaaS multi-établissements.
- Le backend doit être Supabase.
- L’hébergement frontend doit être Vercel.

====================================================
1. OBJECTIF GLOBAL DU PROJET
====================================================

EduNation est une plateforme web de gestion scolaire numérique pour les collèges et lycées du Burkina Faso.

Elle doit permettre :
- aux fondateurs de suivre plusieurs établissements ;
- aux proviseurs/directeurs de gérer l’établissement ;
- aux censeurs de gérer la discipline, absences et emplois du temps ;
- aux secrétaires de gérer les inscriptions, dossiers, documents et bulletins ;
- aux intendants de gérer paiements, budget, frais scolaires et reçus ;
- aux professeurs de saisir notes, absences et cahier de textes ;
- aux conseillers de suivre les élèves et leur orientation ;
- aux parents de suivre leurs enfants ;
- aux élèves de consulter leurs notes, absences, bulletins et emploi du temps.

Le système doit être multi-tenant :
- un fondateur peut gérer plusieurs établissements ;
- chaque établissement possède ses propres classes, élèves, enseignants, paiements, bulletins, notes, absences ;
- aucune donnée d’un établissement ne doit être visible par un autre établissement ;
- toutes les tables métier doivent être filtrées par school_id via RLS Supabase.

====================================================
2. STACK TECHNIQUE IMPOSÉE
====================================================

Utiliser exactement cette stack :

Frontend :
- Next.js 15 avec App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide React Icons
- TanStack Table
- React Hook Form
- Zod
- Recharts
- Sonner pour les toasts
- Next Themes pour dark mode optionnel
- date-fns pour les dates
- clsx + tailwind-merge
- html2canvas / jspdf ou React PDF pour certains exports PDF si nécessaire

Backend :
- Supabase
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase Storage
- Supabase Realtime si utile
- Supabase Edge Functions pour les traitements sensibles :
  - génération IUN ;
  - validation SMS simulée ou réelle ;
  - génération hash bulletin ;
  - actions administratives critiques ;
  - notifications ;
  - webhook paiement plus tard.

Hébergement :
- Vercel pour le frontend Next.js
- Supabase pour backend, database, auth, storage, edge functions

PDF :
- Génération des bulletins, reçus et attestations
- Option recommandée : génération côté serveur via Supabase Edge Function ou API Route Next.js protégée
- Prévoir QR code d’authentification des bulletins
- Prévoir numéro de série unique

Notifications :
- Notifications internes stockées en base Supabase
- Email via Resend/Brevo plus tard
- SMS via fournisseur configurable plus tard
- Dans le MVP : prévoir une table sms_logs et une simulation d’envoi SMS

Sécurité :
- Supabase Auth
- RLS activé sur toutes les tables sensibles
- Policies par rôle et school_id
- Zod pour validation côté client et serveur
- Middleware Next.js pour protéger les routes
- Audit logs
- Rate limiting logique sur les actions sensibles si possible
- Aucun accès direct non contrôlé aux données sensibles

====================================================
3. DESIGN GLOBAL ATTENDU
====================================================

Créer une interface SaaS moderne, premium, claire, institutionnelle et professionnelle.

Style attendu :
- design propre, humain, pas générique ;
- couleurs principales : bleu institutionnel, blanc, gris clair ;
- touches vertes pour succès ;
- orange/rouge pour alertes ;
- dashboards très lisibles ;
- cards KPI modernes ;
- tableaux propres avec recherche, filtres, tri, pagination ;
- sidebar claire par rôle ;
- topbar avec établissement actif, année scolaire active, notifications, profil utilisateur ;
- mode clair en priorité ;
- dark mode optionnel ;
- responsive parfait.

Créer une structure UI cohérente :
- layout public ;
- layout auth ;
- layout dashboard privé ;
- sidebar dynamique selon rôle ;
- breadcrumb ;
- page header standardisée ;
- empty states ;
- loading skeletons ;
- error states ;
- modals propres ;
- toasts de succès/erreur ;
- confirm dialogs pour suppressions et actions sensibles.

L’interface doit être digne d’une vraie plateforme SaaS scolaire professionnelle.

====================================================
4. RÔLES UTILISATEURS À IMPLÉMENTER
====================================================

Créer un système RBAC strict avec Supabase.

Rôles :

1. SUPER_ADMIN_EDUNATION
- Gère toute la plateforme EduNation
- Crée, active, désactive les établissements
- Voit les statistiques globales SaaS
- Gère les utilisateurs globaux
- Ne modifie pas les notes sauf action technique exceptionnelle journalisée

2. FONDATEUR
- Propriétaire d’un ou plusieurs établissements privés
- Consulte les tableaux de bord consolidés
- Consulte les rapports financiers
- Consulte les résultats globaux
- Peut activer/désactiver le compte du proviseur
- Ne gère pas les opérations quotidiennes

3. PROVISEUR / DIRECTEUR
- Chef d’établissement
- Gère l’établissement au quotidien
- Gère le personnel
- Valide les inscriptions
- Configure années scolaires, classes, matières, coefficients
- Supervise notes, absences, discipline
- Valide les bulletins
- Génère les liens d’inscription du personnel
- Génère rapports et attestations

4. CENSEUR
- Responsable discipline et emplois du temps
- Crée, modifie et supprime les emplois du temps
- Gère les absences élèves et professeurs
- Gère sanctions et discipline
- Organise examens internes
- Peut voir les notes
- Ne modifie pas les notes

5. CONSEILLER
- Suit les élèves en difficulté
- Consulte notes, dossiers, absences
- Gère fiches d’orientation
- Prépare conseils de classe
- Ne modifie pas les notes
- N’accède pas au budget

6. INTENDANT
- Gère finances, paiements, budget
- Suit frais scolaires
- Génère reçus PDF
- Gère dépenses, recettes, salaires, fournisseurs
- Consulte rapports financiers
- N’accède pas aux notes détaillées sauf statistiques globales autorisées

7. SECRÉTAIRE
- Gère inscriptions élèves
- Gère dossiers administratifs
- Gère parents/tuteurs
- Génère attestations
- Génère bulletins après validation
- Imprime documents officiels
- Ne modifie pas les notes

8. VIE_SCOLAIRE
- Supervise absences
- Justifie ou rejette absences
- Notifie parents
- Consulte emploi du temps
- Gère carnets/incidents
- Ne saisit pas les absences de cours à la place du professeur sauf permission spéciale
- Ne modifie pas les notes

9. PROFESSEUR
- Voit uniquement ses classes, matières et élèves assignés
- Saisit ses propres notes
- Saisit les absences pendant ses cours
- Consulte son emploi du temps
- Rédige appréciations
- Tient cahier de textes
- Ne voit pas les notes des autres matières sauf synthèse autorisée

10. PARENT
- Suit un ou plusieurs enfants
- Voit notes, absences, bulletins, paiements, messages, emploi du temps de ses enfants uniquement
- Envoie justification d’absence
- Reçoit messages texte/audio
- Consulte paiements

11. ELEVE
- Consulte ses notes, absences, bulletins, emploi du temps, messages
- Lecture seule de ses propres données

12. PARENT_ILLETTRÉ
- Même accès que parent
- Interface web simplifiée spéciale
- Navigation par gros boutons/icônes
- Lecture audio des informations importantes via Web Speech API ou TTS navigateur
- Support langue préférée : français, mooré, dioula, fulfuldé
- Prévoir messages audio enregistrés
- Prévoir SMS de secours

====================================================
5. ARCHITECTURE SUPABASE ATTENDUE
====================================================

Créer une architecture Supabase propre.

Supabase doit gérer :
- authentification ;
- base de données PostgreSQL ;
- RLS ;
- stockage des fichiers ;
- edge functions ;
- realtime si nécessaire.

Créer les dossiers suivants :

/supabase
  /migrations
  /functions
    /generate-iun
    /verify-sms-code
    /create-staff-invitation
    /generate-report-card-hash
    /send-notification
    /simulate-payment
  /seed.sql

Créer aussi :
- types générés Supabase ;
- client browser Supabase ;
- client server Supabase ;
- helpers auth ;
- helpers permissions ;
- helpers storage.

Séparer :
- supabase client côté navigateur ;
- supabase client côté serveur ;
- service role key uniquement côté serveur, jamais côté client.

====================================================
6. SCHÉMA DE BASE DE DONNÉES SUPABASE
====================================================

Créer les tables PostgreSQL suivantes avec UUID, timestamps et RLS.

Tables principales :

1. profiles
- id uuid primary key references auth.users(id)
- full_name
- phone
- email
- avatar_url
- default_role
- is_active
- created_at
- updated_at

2. roles
- id uuid
- code unique
- name
- description

3. permissions
- id uuid
- code unique
- name
- description

4. role_permissions
- role_id
- permission_id

5. user_school_roles
- id uuid
- user_id references profiles(id)
- school_id references schools(id)
- role_code
- is_active
- created_at

6. schools
- id uuid
- founder_id references profiles(id)
- name
- type
- address
- city
- province
- country default 'Burkina Faso'
- phone
- email
- logo_url
- motto
- is_active
- created_at
- updated_at

7. school_years
- id uuid
- school_id
- name
- start_date
- end_date
- is_active

8. terms
- id uuid
- school_id
- school_year_id
- name
- type : trimestre/semestre
- start_date
- end_date
- is_active

9. class_levels
- id uuid
- school_id
- name
- order_index

10. classes
- id uuid
- school_id
- school_year_id
- level_id
- name
- main_teacher_id
- capacity
- created_at

11. subjects
- id uuid
- school_id
- name
- code
- description

12. class_subjects
- id uuid
- school_id
- class_id
- subject_id
- coefficient

13. teacher_assignments
- id uuid
- school_id
- teacher_id references profiles(id)
- class_id
- subject_id
- school_year_id
- is_active

14. students
- id uuid
- school_id
- iun unique
- first_name
- last_name
- birth_date
- birth_place
- gender
- cnib_number nullable
- phone nullable
- photo_url
- status : pending/active/rejected/transferred/inactive
- has_personal_phone boolean
- created_at
- updated_at

15. student_enrollments
- id uuid
- school_id
- student_id
- class_id
- school_year_id
- status
- enrolled_at

16. iun_sequences
- id uuid
- birth_year
- current_number
- created_at
- updated_at

17. parent_profiles
- id uuid
- user_id references profiles(id)
- cni_number
- cni_scan_url
- literacy_level : alphabetise/illetre
- preferred_language : fr/moore/dioula/fulfulde
- validation_status : pending/validated/rejected
- physical_validation_required boolean default true
- validated_by
- validated_at

18. parent_student_relations
- id uuid
- school_id
- parent_user_id references profiles(id)
- student_id
- relation_type : pere/mere/tuteur_legal/autre
- is_primary
- birth_certificate_url
- validated_by
- validated_at
- unique(parent_user_id, student_id)

19. staff_invitations
- id uuid
- school_id
- role_code
- invited_by
- token unique
- expires_at
- used_at
- status

20. assessments
- id uuid
- school_id
- school_year_id
- term_id
- class_id
- subject_id
- teacher_id
- title
- type : devoir/interrogation/composition/examen
- coefficient
- assessment_date
- is_locked
- created_at

21. grades
- id uuid
- school_id
- assessment_id
- student_id
- grade numeric check 0 <= grade <= 20
- appreciation
- created_by
- updated_by
- is_locked
- created_at
- updated_at

22. grade_history
- id uuid
- school_id
- grade_id
- old_value
- new_value
- changed_by
- reason
- created_at

23. attendance_records
- id uuid
- school_id
- school_year_id
- class_id
- subject_id
- student_id
- teacher_id
- timetable_slot_id nullable
- status : present/absent/late/sick/excused
- recorded_at
- source : web/backup_sms/manual/offline_sync
- sync_status
- created_at

24. attendance_justifications
- id uuid
- school_id
- attendance_record_id
- parent_user_id
- reason
- attachment_url
- status : pending/approved/rejected
- reviewed_by
- reviewed_at

25. offline_sync_queue
- id uuid
- user_id
- school_id
- entity_type
- payload jsonb
- status
- retry_count
- created_at
- synced_at

26. timetable_slots
- id uuid
- school_id
- school_year_id
- class_id
- subject_id
- teacher_id
- room
- day_of_week
- start_time
- end_time

27. replacements
- id uuid
- school_id
- timetable_slot_id
- absent_teacher_id
- replacement_teacher_id
- reason
- created_by
- created_at

28. fee_structures
- id uuid
- school_id
- school_year_id
- class_level_id
- label
- amount
- due_date
- is_required

29. payments
- id uuid
- school_id
- student_id
- parent_user_id nullable
- amount
- payment_method : cash/mobile_money/bank_transfer/other
- status : pending/paid/partial/overdue/cancelled
- reference
- paid_at
- recorded_by

30. receipts
- id uuid
- school_id
- payment_id
- receipt_number unique
- pdf_url
- generated_by
- generated_at

31. report_card_templates
- id uuid
- school_id
- code : A_STANDARD/B_PREMIUM/C_COMPACT
- name
- config jsonb
- is_active

32. report_cards
- id uuid
- school_id
- school_year_id
- term_id
- student_id
- class_id
- template_id
- average
- rank
- appreciation
- pdf_url
- qr_hash
- serial_number unique
- status : draft/generated/validated/published/archived
- generated_by
- validated_by
- generated_at
- validated_at

33. messages
- id uuid
- school_id
- sender_id
- subject
- body
- message_type : text/audio
- audio_url nullable
- created_at

34. message_recipients
- id uuid
- message_id
- recipient_id
- read_at

35. announcements
- id uuid
- school_id
- title
- content
- target_type : all/class/parents/staff/students
- target_id nullable
- published_by
- published_at

36. notifications
- id uuid
- school_id
- user_id
- title
- body
- type
- is_read
- created_at

37. discipline_incidents
- id uuid
- school_id
- student_id
- reported_by
- incident_type
- description
- incident_date
- status

38. sanctions
- id uuid
- school_id
- student_id
- incident_id
- sanction_type
- description
- start_date
- end_date
- created_by

39. orientation_notes
- id uuid
- school_id
- student_id
- counselor_id
- note
- created_at

40. documents
- id uuid
- school_id
- student_id nullable
- parent_user_id nullable
- type
- title
- file_url
- created_by
- created_at

41. audit_logs
- id uuid
- school_id nullable
- actor_id
- action
- entity_type
- entity_id
- old_data jsonb
- new_data jsonb
- ip_address
- user_agent
- created_at

42. sms_verification_codes
- id uuid
- phone
- code_hash
- purpose
- expires_at
- verified_at
- attempts
- created_at

43. sms_logs
- id uuid
- school_id nullable
- phone
- message
- status
- provider
- created_at

====================================================
7. RLS SUPABASE OBLIGATOIRE
====================================================

Activer RLS sur toutes les tables sensibles.

Règles générales :
- SUPER_ADMIN_EDUNATION peut accéder aux données globales selon politiques spécifiques.
- Un utilisateur ne voit les données d’une école que s’il possède un rôle actif dans user_school_roles pour cette school_id.
- Un professeur ne voit que ses classes/matières assignées.
- Un parent ne voit que les données des enfants liés dans parent_student_relations.
- Un élève ne voit que ses propres données.
- Les notes ne sont modifiables que par le professeur assigné, tant qu’elles ne sont pas verrouillées.
- Les paiements sont visibles par intendant, secrétaire, proviseur, fondateur et parent concerné.
- Les bulletins sont visibles par direction, secrétaire, professeur principal si autorisé, parent concerné et élève concerné.

Créer des fonctions SQL helper :
- is_super_admin()
- has_school_role(school_id uuid, role text)
- has_any_school_role(school_id uuid, roles text[])
- is_teacher_assigned(school_id uuid, class_id uuid, subject_id uuid)
- is_parent_of_student(student_id uuid)
- is_student_owner(student_id uuid)
- can_access_school(school_id uuid)

Ne jamais désactiver RLS pour “simplifier”.
Ne jamais exposer la service_role key côté client.

====================================================
8. MODULES À DÉVELOPPER
====================================================

Développer les modules suivants.

----------------------------------------------------
8.1 Module Authentification
----------------------------------------------------

Fonctionnalités :
- Connexion email/téléphone + mot de passe
- Inscription contrôlée selon rôle
- Mot de passe oublié
- Vérification SMS simulée au départ
- 2FA par code SMS pour rôles sensibles
- Session Supabase
- Déconnexion
- Changement mot de passe
- Protection des routes par middleware Next.js
- Journalisation des connexions

Pages :
- /login
- /forgot-password
- /reset-password
- /verify-code
- /dashboard

----------------------------------------------------
8.2 Module Établissements
----------------------------------------------------

Fonctionnalités :
- Création établissement par super admin ou fondateur
- Informations : nom, type, adresse, ville, province, pays, téléphone, email, logo, devise
- Upload logo dans Supabase Storage
- Configuration année scolaire
- Configuration périodes : trimestre ou semestre
- Configuration niveaux : 6e, 5e, 4e, 3e, 2nde, 1ère, Terminale
- Gestion multi-établissements
- Sélecteur d’établissement actif dans la topbar

Pages :
- /dashboard/schools
- /dashboard/schools/new
- /dashboard/schools/[id]
- /dashboard/schools/[id]/settings

----------------------------------------------------
8.3 Module Personnel et liens d’inscription
----------------------------------------------------

Le proviseur peut créer des postes et générer des liens d’inscription pour le personnel.

Fonctionnalités :
- Liste personnel
- Création invitation personnel
- Choix poste : censeur, conseiller, intendant, secrétaire, vie scolaire, professeur
- Génération lien unique avec expiration
- Acceptation invitation
- Création compte personnel via Supabase Auth
- Affectation établissement
- Activation/désactivation compte
- Audit log

Pages :
- /dashboard/staff
- /dashboard/staff/invitations
- /dashboard/staff/new-invitation
- /join/staff/[token]

----------------------------------------------------
8.4 Module Inscriptions Élèves
----------------------------------------------------

Cas A : élève avec téléphone
- Formulaire inscription web
- Nom, prénom, date naissance, lieu naissance, sexe, CNIB facultatif
- Téléphone
- Vérification SMS code 6 chiffres, expiration 5 minutes
- Création mot de passe : minimum 8 caractères, 1 majuscule, 1 chiffre
- Génération automatique IUN
- Statut EN_ATTENTE
- Validation secrétariat sous 48h
- Passage au statut ACTIF

Cas B : élève sans téléphone
- Option “Je n’ai pas de téléphone”
- Informations élève
- Informations parent : nom, prénom, téléphone, lien de parenté
- Si parent existe : confirmation par SMS
- Si parent n’existe pas : création compte parent virtuel
- IUN généré avec téléphone élève NULL
- Notifications redirigées vers parent
- Ajout téléphone personnel possible plus tard

IUN :
Format : BF-AAAA-XXXXXX-C
- BF = pays
- AAAA = année naissance
- XXXXXX = numéro séquentiel
- C = chiffre de contrôle avec algorithme de Luhn
- IUN unique, permanent, portable entre établissements

Implémenter la génération IUN dans une Supabase Edge Function ou une fonction PostgreSQL transactionnelle pour éviter les doublons.

Pages :
- /register/student
- /register/student/with-phone
- /register/student/without-phone
- /dashboard/students/pending
- /dashboard/students
- /dashboard/students/[id]
- /dashboard/students/[id]/edit

----------------------------------------------------
8.5 Module Parents / Tuteurs
----------------------------------------------------

Principe :
- Pas d’auto-inscription parent validée automatiquement.
- Pré-inscription possible.
- Validation physique obligatoire au secrétariat.

Pré-inscription :
- Identité complète
- CNI obligatoire
- Téléphone avec vérification SMS
- Déclaration enfants
- Upload extraits de naissance dans Supabase Storage
- Niveau alphabétisation
- Langue préférée
- Génération code PV-AAAA-MM-XXXXX
- Envoi SMS/email simulé au MVP avec log en base

Validation secrétariat :
- Vérification CNI
- Scan CNI archivé
- Photo prise sur place ou upload photo
- Test appel téléphonique indiqué manuellement
- Liaison enfant-parent
- Activation compte
- Génération fiche identifiants PDF
- Signature registre physique indiquée dans le système

Pages :
- /register/parent/pre-registration
- /dashboard/parents/pending
- /dashboard/parents
- /dashboard/parents/[id]
- /dashboard/parents/[id]/children
- /dashboard/parents/validate/[id]

----------------------------------------------------
8.6 Module Classes, Niveaux, Matières
----------------------------------------------------

Fonctionnalités :
- CRUD niveaux
- CRUD classes
- CRUD matières
- Coefficients par matière et niveau
- Affectation professeurs aux matières/classes
- Professeur principal par classe
- Effectif classe
- Historique par année scolaire

Pages :
- /dashboard/classes
- /dashboard/classes/new
- /dashboard/classes/[id]
- /dashboard/subjects
- /dashboard/teaching-assignments

----------------------------------------------------
8.7 Module Notes et Évaluations
----------------------------------------------------

Fonctionnalités :
- Création évaluations : devoir, interrogation, composition, examen
- Période : trimestre/semestre
- Matière, classe, coefficient, date
- Saisie notes par professeur uniquement pour ses classes/matières
- Validation 0 <= note <= 20
- Import Excel
- Calcul automatique moyennes par matière
- Calcul moyenne générale
- Classement
- Alertes performance si baisse significative
- Historique complet notes
- Verrouillage notes après conseil de classe
- Validation par proviseur/censeur selon configuration
- Audit log sur modification de notes

Pages :
- /dashboard/grades
- /dashboard/grades/assessments
- /dashboard/grades/entry
- /dashboard/grades/import
- /dashboard/grades/class-ranking
- /dashboard/grades/student/[id]
- /dashboard/grades/validation

----------------------------------------------------
8.8 Module Absences et Retards avec Offline Web
----------------------------------------------------

Comme c’est web uniquement :
- implémenter un mode offline web via PWA + IndexedDB.
- Le professeur doit pouvoir saisir les absences même sans connexion.
- Les données sont sauvegardées localement puis synchronisées au retour réseau.

Fonctionnement :

Phase avant cours :
- téléchargement des classes du professeur ;
- élèves, IUN, photos basse résolution ;
- emploi du temps ;
- stockage IndexedDB ;
- badge “Mode hors-ligne prêt”.

Pendant cours :
- sélection classe/matière/créneau ;
- tous présents par défaut ;
- clic = absent ;
- menu rapide = retard / dispensé / malade ;
- sauvegarde locale immédiate ;
- mise en file d’attente sync.

Après retour connexion :
- détection réseau ;
- synchronisation automatique vers Supabase ;
- création notifications parents ;
- gestion conflits :
  - timestamp le plus récent ;
  - si écart > 1h, demander confirmation du professeur ;
- badge “Tout synchronisé”.

Paramètres :
- alerte cache après 7 jours sans sync ;
- blocage après 14 jours ;
- max 100 pointages en attente ;
- retry sync 5 tentatives exponentielles.

Pages :
- /dashboard/attendance
- /dashboard/attendance/take
- /dashboard/attendance/offline-queue
- /dashboard/attendance/justifications
- /dashboard/attendance/reports
- /dashboard/attendance/settings

----------------------------------------------------
8.9 Module Vie Scolaire / Discipline
----------------------------------------------------

Fonctionnalités :
- Incidents élèves
- Sanctions
- Carnet de correspondance numérique
- Suivi absences injustifiées
- Notification parents
- Historique discipline
- Rapports discipline

Pages :
- /dashboard/student-life
- /dashboard/student-life/incidents
- /dashboard/student-life/sanctions
- /dashboard/student-life/discipline-reports

----------------------------------------------------
8.10 Module Emplois du Temps
----------------------------------------------------

Fonctionnalités :
- Création emploi du temps par classe
- Création emploi du temps par professeur
- Créneaux horaires
- Salles
- Matière
- Professeur
- Gestion conflits : prof déjà occupé, salle occupée, classe occupée
- Remplacements professeurs
- Vue semaine
- Consultation selon rôle

Pages :
- /dashboard/timetable
- /dashboard/timetable/classes
- /dashboard/timetable/teachers
- /dashboard/timetable/new
- /dashboard/timetable/replacements

----------------------------------------------------
8.11 Module Paiements Scolaires
----------------------------------------------------

Fonctionnalités :
- Configuration frais scolaires par classe/niveau
- Paiement complet/partiel
- Arriérés
- Échéancier
- Historique paiements
- Reçus PDF
- Rappels aux parents
- Paiement Mobile Money prévu plus tard
- Au MVP, simuler Mobile Money
- Statuts paiement : pending, paid, partial, overdue, cancelled
- Rapports financiers
- Accès : intendant, secrétaire, proviseur, fondateur

Pages :
- /dashboard/finance
- /dashboard/finance/fees
- /dashboard/finance/payments
- /dashboard/finance/payments/new
- /dashboard/finance/receipts
- /dashboard/finance/reports
- /dashboard/finance/arrears

----------------------------------------------------
8.12 Module Bulletins Scolaires
----------------------------------------------------

Templates :

A — Standard Burkina
- A4 recto
- notation /20
- zones : en-tête, identité élève + IUN, résultats, vie scolaire, appréciations, signatures

B — Détaillé Premium
- A4 recto-verso ou 2 pages
- appréciations par matière
- graphiques évolution 3 trimestres
- compétences transversales
- QR code authentification

C — Compact Économique
- demi-page A4
- noir et blanc
- abréviations matières
- codes appréciations : TB, B, AB, F, I

Assistant configuration bulletins :
1. choix template avec prévisualisation ;
2. identité visuelle : logo, nom, adresse, devise ;
3. paramètres académiques : notation, périodes, mentions, bonus/malus ;
4. options affichage : rang, statistiques classe, photo, conduite, absences ;
5. matières et coefficients par classe ;
6. signatures numériques : PNG transparent proviseur + cachet.

Appréciations :
- appréciation générale max 300 caractères ;
- appréciation par matière max 100 caractères ;
- bibliothèque phrases types ;
- suggestions IA prévues plus tard, non prioritaire.

Workflow :
- saisie notes ;
- conseil de classe ;
- clôture/verrouillage notes ;
- génération PDF batch ;
- filigrane élève ;
- QR code ;
- signature numérique ;
- numéro série unique ;
- checklist secrétariat ;
- diffusion numérique : SMS/email/accès web ;
- retrait papier optionnel.

Sécurité bulletin :
- QR code auth avec hash SHA-256 : IUN + période + moyenne + timestamp ;
- mot de passe PDF par défaut = date naissance élève ;
- archivage à vie via IUN.

Pages :
- /dashboard/report-cards
- /dashboard/report-cards/templates
- /dashboard/report-cards/config-wizard
- /dashboard/report-cards/generate
- /dashboard/report-cards/batch
- /dashboard/report-cards/verify
- /dashboard/report-cards/archive

----------------------------------------------------
8.13 Module Communication
----------------------------------------------------

Fonctionnalités :
- Messagerie interne
- Messages texte
- Messages audio via upload/enregistrement web si possible
- Annonces officielles
- Circulaires
- Agenda scolaire
- Notifications internes
- Messages ciblés : classe, parent, élève, professeur, tout établissement
- Interface simplifiée parents illettrés

Pages :
- /dashboard/messages
- /dashboard/messages/new
- /dashboard/announcements
- /dashboard/announcements/new
- /dashboard/calendar
- /dashboard/notifications

----------------------------------------------------
8.14 Module Accessibilité Parents Illettrés Web
----------------------------------------------------

Créer une interface web spéciale accessible via :
- /parent-simple

Fonctionnalités :
- 3 à 4 grands boutons :
  1. Notes
  2. Absences
  3. Messages
  4. Paiements
- gros icônes
- couleurs intuitives
- audio “lire cette page”
- lecture automatique des messages
- choix langue : français, mooré, dioula, fulfuldé
- navigation ultra simple
- possibilité d’envoyer message vocal
- pas de menus complexes
- design très clair pour personnes non-lettrées

Tech :
- utiliser Web Speech API pour TTS navigateur si disponible
- fallback : fichiers audio préenregistrés plus tard
- prévoir architecture i18n

Pages :
- /parent-simple
- /parent-simple/children
- /parent-simple/notes
- /parent-simple/absences
- /parent-simple/messages
- /parent-simple/payments

----------------------------------------------------
8.15 Module Rapports et Statistiques
----------------------------------------------------

Dashboards par rôle :

SUPER ADMIN :
- nombre établissements ;
- utilisateurs actifs ;
- écoles actives/inactives ;
- croissance plateforme.

FONDATEUR :
- vue multi-écoles ;
- effectifs totaux ;
- paiements ;
- arriérés ;
- performance globale ;
- comparaison établissements.

PROVISEUR :
- effectifs ;
- notes moyennes ;
- absences ;
- discipline ;
- finances synthétiques ;
- bulletins prêts/en attente.

CENSEUR :
- absences ;
- retards ;
- sanctions ;
- emplois du temps ;
- remplacements.

INTENDANT :
- paiements ;
- recettes ;
- arriérés ;
- reçus ;
- dépenses ;
- rapports financiers.

PROFESSEUR :
- ses classes ;
- notes à saisir ;
- absences récentes ;
- cahier de textes ;
- progression élèves.

PARENT :
- vue multi-enfants ;
- moyenne ;
- présence ;
- paiements ;
- alertes.

ELEVE :
- notes ;
- absences ;
- bulletin ;
- emploi du temps.

Exports :
- PDF ;
- Excel ;
- CSV.

Pages :
- /dashboard/reports
- /dashboard/reports/academic
- /dashboard/reports/attendance
- /dashboard/reports/finance
- /dashboard/reports/students
- /dashboard/reports/exports

----------------------------------------------------
8.16 Module Documents Officiels
----------------------------------------------------

Fonctionnalités :
- Attestation de scolarité
- Certificat de présence
- Fiche élève
- Fiche parent
- Reçu de paiement
- Bulletin
- Documents avec logo école, QR code, numéro unique
- Impression
- Stockage PDF dans Supabase Storage

Pages :
- /dashboard/documents
- /dashboard/documents/templates
- /dashboard/documents/generate

----------------------------------------------------
8.17 Module Audit Logs
----------------------------------------------------

Journaliser :
- connexions ;
- échecs login ;
- création utilisateur ;
- modification note ;
- validation bulletin ;
- suppression donnée ;
- changement permission ;
- paiement enregistré ;
- bulletin généré ;
- parent validé ;
- élève validé.

Pages :
- /dashboard/audit-logs

====================================================
9. STRUCTURE DE DOSSIERS NEXT.JS ATTENDUE
====================================================

Créer une architecture propre :

/app
  /(public)
    /page.tsx
  /(auth)
    /login
    /forgot-password
    /reset-password
    /verify-code
  /(dashboard)
    /dashboard
    /dashboard/schools
    /dashboard/staff
    /dashboard/students
    /dashboard/parents
    /dashboard/classes
    /dashboard/subjects
    /dashboard/grades
    /dashboard/attendance
    /dashboard/timetable
    /dashboard/finance
    /dashboard/report-cards
    /dashboard/messages
    /dashboard/announcements
    /dashboard/reports
    /dashboard/documents
    /dashboard/audit-logs
  /parent-simple
  /api

/components
  /ui
  /layout
  /forms
  /tables
  /charts
  /cards
  /modals
  /pdf
  /accessibility

/features
  /auth
  /schools
  /staff
  /students
  /parents
  /classes
  /subjects
  /grades
  /attendance
  /timetable
  /finance
  /report-cards
  /communication
  /reports
  /documents
  /audit

/lib
  /supabase
    /client.ts
    /server.ts
    /middleware.ts
    /admin.ts
  /auth
  /permissions
  /validations
  /storage
  /sms
  /email
  /pdf
  /i18n
  /offline
  /utils

/types
  /database.types.ts
  /roles.ts
  /permissions.ts
  /global.ts

/supabase
  /migrations
  /functions
  /seed.sql

====================================================
10. PAGES À CRÉER EN PRIORITÉ
====================================================

Créer d’abord ces pages dans cet ordre :

1. Landing page EduNation
- Présentation courte
- Problème
- Solution
- Modules
- Accessibilité parents illettrés
- Appel à action

2. Auth
- Login
- Forgot password
- Verify code

3. Dashboard layout
- Sidebar dynamique
- Topbar
- Notifications
- Profil
- Sélecteur établissement/année scolaire

4. Dashboard Proviseur
- KPIs établissement
- élèves
- classes
- absences
- notes
- paiements
- bulletins en attente

5. Gestion élèves
- Liste
- Ajout
- Détail
- Validation

6. Gestion parents
- Préinscriptions
- Validation physique
- Liaison enfant-parent

7. Notes
- Évaluations
- Saisie notes
- Import Excel
- Classement

8. Absences
- Prise d’absence
- Mode offline web IndexedDB
- Justifications
- Rapports

9. Bulletins
- Config wizard
- Génération
- Archive
- Vérification QR

10. Paiements
- Frais
- Paiements
- Reçus
- Arriérés

11. Communication
- Messages
- Annonces
- Notifications

12. Accessibilité parent illettré
- Interface simplifiée web

====================================================
11. RÈGLES MÉTIER IMPORTANTES
====================================================

- Un élève possède un IUN permanent.
- Un parent ne peut être validé définitivement qu’après validation physique au secrétariat.
- Un parent peut gérer plusieurs enfants.
- Un enfant peut avoir plusieurs parents/tuteurs.
- Un professeur ne peut saisir que les notes de ses propres classes/matières.
- Une note verrouillée après conseil de classe ne peut plus être modifiée sauf permission spéciale.
- Toute modification de note doit être historisée.
- Les bulletins ne peuvent être générés qu’après validation des notes.
- Le secrétaire peut générer/imprimer les bulletins, mais ne peut pas modifier les notes.
- L’intendant gère les paiements, mais ne modifie pas les notes.
- Le censeur gère discipline et emplois du temps.
- La vie scolaire supervise et justifie les absences.
- Le fondateur voit les rapports consolidés mais ne fait pas les opérations quotidiennes.
- Le super admin EduNation administre la plateforme, pas les données pédagogiques au quotidien.
- L’accès aux données doit toujours être limité par school_id, rôle et permissions.
- Toutes les actions sensibles doivent être enregistrées dans audit_logs.

====================================================
12. EXIGENCES UX/UI
====================================================

Pour chaque module :
- afficher des statistiques utiles en haut de page ;
- proposer recherche, filtres, tri, pagination ;
- prévoir boutons d’action clairs ;
- utiliser des badges de statut ;
- utiliser des couleurs cohérentes ;
- afficher des confirmations avant actions sensibles ;
- afficher des messages d’erreur compréhensibles ;
- créer des formulaires en plusieurs étapes quand nécessaire ;
- prévoir import/export quand utile ;
- éviter les interfaces surchargées.

Créer une UI très professionnelle, adaptée à une vraie école africaine moderne.

====================================================
13. EXIGENCES DE QUALITÉ CODE
====================================================

- TypeScript strict
- Zod pour validation
- shadcn/ui pour composants UI
- Composants réutilisables
- Services métier séparés
- Permissions centralisées
- Aucun accès sensible uniquement côté client
- RLS Supabase obligatoire
- Gestion erreurs propre
- Loading states partout
- Empty states partout
- Code lisible, maintenable, commenté uniquement si nécessaire
- Générer les types Supabase
- Ne jamais exposer service_role côté client
- Préparer tests unitaires pour fonctions critiques :
  - génération IUN ;
  - calcul moyenne ;
  - calcul rang ;
  - permissions ;
  - hash bulletin ;
  - validation note ;
  - relation parent-enfant.

====================================================
14. DONNÉES DE DÉMONSTRATION
====================================================

Créer un seed Supabase avec :
- 1 super admin
- 1 fondateur
- 1 établissement “Lycée Privé EduNation Démo”
- 1 proviseur
- 1 censeur
- 1 conseiller
- 1 intendant
- 1 secrétaire
- 1 agent vie scolaire
- 5 professeurs
- 4 classes
- 10 matières
- 80 élèves
- 50 parents
- relations parent-enfant
- notes de démonstration
- absences de démonstration
- paiements de démonstration
- annonces
- messages
- bulletins simulés

====================================================
15. CONFIGURATION VERCEL
====================================================

Prévoir déploiement sur Vercel.

Variables d’environnement :
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_JWT_SECRET si nécessaire
- NEXT_PUBLIC_APP_URL
- RESEND_API_KEY optionnel
- SMS_PROVIDER_API_KEY optionnel

Important :
- Les variables sensibles doivent rester côté serveur.
- La service role key ne doit jamais être utilisée dans un composant client.
- Prévoir middleware pour protéger les routes dashboard.
- Prévoir configuration build stable pour Vercel.

====================================================
16. CE QUE TU DOIS FAIRE MAINTENANT
====================================================

Commence par analyser le besoin, puis propose un plan d’implémentation technique.

Ensuite :
1. Crée la structure du projet Next.js.
2. Installe les dépendances nécessaires.
3. Configure Tailwind CSS.
4. Configure shadcn/ui.
5. Configure Supabase client/server.
6. Prépare les migrations SQL Supabase.
7. Crée le schéma complet PostgreSQL.
8. Active RLS sur toutes les tables.
9. Crée les fonctions SQL helper de permissions.
10. Crée les policies RLS essentielles.
11. Crée les layouts public/auth/dashboard.
12. Crée le système RBAC côté frontend et côté Supabase.
13. Crée les premières pages prioritaires.
14. Implémente le dashboard principal.
15. Implémente progressivement les modules selon priorité.
16. Vérifie à chaque étape que le projet compile.
17. Vérifie que TypeScript est propre.
18. Vérifie que les permissions sont respectées.
19. Vérifie que les données sont toujours filtrées par school_id.
20. Prépare le projet pour déploiement Vercel.

Ne fais pas une maquette vide.
Je veux une vraie base fonctionnelle, professionnelle, maintenable et évolutive.

Priorité absolue :
- architecture propre ;
- Supabase Auth ;
- RLS strict ;
- multi-tenant ;
- gestion élèves/parents ;
- notes ;
- absences offline web ;
- bulletins PDF ;
- paiements ;
- dashboards ;
- interface parent illettré web.
