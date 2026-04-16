import {
  Search, BookOpen, Video, ArrowUpRight, Bookmark, Star, MapPin,
  Phone as PhoneIcon, Clock, ChevronRight as ChevronRightIcon,
  PlayCircle, FileText, Lightbulb, Heart, Brain, Apple, Activity,
  Shield, Users, Pill, Baby, Sun, ChevronDown, ExternalLink,
  TrendingUp, Award, AlertCircle, CheckCircle2, Globe, Download,
  Stethoscope, Microscope, Syringe, HeartHandshake, Leaf, Zap,
  BookMarked, Link, Smartphone, Building2, HelpCircle
} from "lucide-react";
import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const ALL_ARTICLES = [
  // Traitements
  { id: 1,  title: "Comprendre les effets de votre traitement sur la durée", type: "Article", time: "5 min", category: "Traitements", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", bookmarked: true,  featured: true,  desc: "ARV, charge virale, CD4 : tout ce qu'il faut savoir pour suivre son traitement efficacement." },
  { id: 2,  title: "Les nouvelles molécules ARV disponibles au Sénégal", type: "Article", time: "7 min", category: "Traitements", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80", bookmarked: false, featured: false, desc: "Dolutégravir, Cabotégravir : les traitements de 2e et 3e ligne disponibles en 2024." },
  { id: 3,  title: "Gérer un oubli de prise d'ARV : que faire ?", type: "Article", time: "3 min", category: "Traitements", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80", bookmarked: false, featured: false, desc: "Protocoles selon le délai écoulé depuis l'oubli. À lire et à mémoriser." },
  { id: 4,  title: "Interactions médicamenteuses : ce que votre médecin doit savoir", type: "Article", time: "6 min", category: "Traitements", image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80", bookmarked: false, featured: false, desc: "ARV et phytothérapie, automédication : les risques méconnus." },
  { id: 21, title: "Comprendre vos résultats de CD4 et charge virale", type: "Article", time: "6 min", category: "Traitements", image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80", bookmarked: false, featured: false, desc: "Interpréter les chiffres de votre bilan : seuils normaux, signaux d'alerte, quand consulter." },
  { id: 22, title: "Conservation et stockage de vos médicaments ARV", type: "Article", time: "3 min", category: "Traitements", image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80", bookmarked: false, featured: false, desc: "Température, humidité, voyage : comment garder vos ARV efficaces en toutes circonstances." },
  { id: 23, title: "Effets secondaires des ARV : quand s'inquiéter ?", type: "Article", time: "7 min", category: "Traitements", image: "https://images.unsplash.com/photo-1577368211130-4bbd0181ddf0?w=800&q=80", bookmarked: false, featured: false, desc: "Distinguer effets bénins et signaux d'alarme. Liste des symptômes à signaler en urgence." },
  { id: 24, title: "ARV injectable longue durée : la révolution du traitement", type: "Article", time: "5 min", category: "Traitements", image: "https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?w=800&q=80", bookmarked: false, featured: false, desc: "Cabotégravir + rilpivirine en injection mensuelle : disponibilité, avantages, qui peut en bénéficier." },
  { id: 25, title: "Le suivi biologique complet du PVVIH : guide pratique", type: "Vidéo", time: "10 min", category: "Traitements", image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80", bookmarked: true, featured: false, desc: "Tous les examens biologiques recommandés et leur fréquence selon les recommandations OMS." },
  { id: 26, title: "Résistances aux ARV : comprendre et prévenir", type: "Article", time: "8 min", category: "Traitements", image: "https://images.unsplash.com/photo-1516069677018-378515003435?w=800&q=80", bookmarked: false, featured: false, desc: "Pourquoi l'observance est cruciale pour éviter les mutations virales et les échecs thérapeutiques." },

  // Nutrition
  { id: 5,  title: "Alimentation et ARV : ce qu'il faut savoir", type: "Article", time: "6 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80", bookmarked: false, featured: true,  desc: "Certains aliments amplifient ou inhibent l'absorption des ARV. Guide pratique." },
  { id: 6,  title: "10 aliments qui renforcent le système immunitaire", type: "Article", time: "4 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80", bookmarked: true,  featured: false, desc: "Zinc, vitamine C, oméga-3 : quels aliments prioriser au quotidien." },
  { id: 7,  title: "Recettes sénégalaises adaptées au suivi VIH", type: "Vidéo",   time: "12 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80", bookmarked: false, featured: false, desc: "Thiéboudienne, mafé, yassa : comment adapter les recettes locales pour votre santé." },
  { id: 8,  title: "Hydratation et ARV : les bonnes pratiques", type: "Article", time: "3 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1559181567-c3190ca9d222?w=800&q=80", bookmarked: false, featured: false, desc: "L'eau est essentielle à l'élimination des métabolites. Conseils pratiques." },
  { id: 27, title: "Supplémentation en vitamines et VIH : ce qui est prouvé", type: "Article", time: "5 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&q=80", bookmarked: false, featured: false, desc: "Vitamine D, B12, zinc, sélénium : les carences les plus fréquentes et comment les corriger." },
  { id: 28, title: "Gestion du poids et ARV : pourquoi grossir après le traitement ?", type: "Article", time: "6 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80", bookmarked: false, featured: false, desc: "L'effet métabolique des ARV de 2e ligne. Conseils diététiques pour maintenir un poids santé." },
  { id: 29, title: "Jeûne ramadan et traitement ARV : conseils médicaux", type: "Article", time: "4 min", category: "Nutrition", image: "https://images.unsplash.com/photo-1604598038978-3c8f5e697abe?w=800&q=80", bookmarked: false, featured: false, desc: "Adaptation des horaires de prise, alimentation, suivi pendant le Ramadan pour les PVVIH." },

  // Santé Mentale
  { id: 9,  title: "5 exercices de respiration pour gérer l'anxiété", type: "Vidéo",   time: "8 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80", bookmarked: false, featured: true,  desc: "Technique 4-7-8, cohérence cardiaque : des outils simples validés scientifiquement." },
  { id: 10, title: "Vivre avec le VIH : témoignages de patients au Sénégal", type: "Vidéo",   time: "15 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&q=80", bookmarked: false, featured: false, desc: "Des PVVIH partagent leur parcours de résilience et d'adaptation." },
  { id: 11, title: "Annonce du statut sérologique : comment l'aborder ?", type: "Article", time: "9 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80", bookmarked: true,  featured: false, desc: "À votre partenaire, vos proches, votre employeur : guide selon les situations." },
  { id: 12, title: "Dépression et VIH : reconnaître les signes et agir", type: "Article", time: "7 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1541199249251-f713e6145474?w=800&q=80", bookmarked: false, featured: false, desc: "La dépression est 3x plus fréquente chez les PVVIH. Quand consulter ?" },
  { id: 30, title: "Pleine conscience et acceptation du diagnostic VIH", type: "Vidéo", time: "18 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", bookmarked: false, featured: false, desc: "Programme MBSR adapté aux PVVIH : 8 semaines pour retrouver la sérénité et l'estime de soi." },
  { id: 31, title: "Parler du VIH à ses enfants : quoi dire et à quel âge", type: "Article", time: "8 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1484863137850-59afcfe05386?w=800&q=80", bookmarked: false, featured: false, desc: "Conseils de psychologues pour aborder le sujet avec les enfants selon leur maturité." },
  { id: 32, title: "Soutien du couple face au VIH : renforcer le lien", type: "Article", time: "7 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&q=80", bookmarked: false, featured: false, desc: "Communication, intimité, confiance : comment traverser ensemble cette épreuve et en sortir plus forts." },
  { id: 33, title: "Gestion du stress chronique chez les PVVIH", type: "Article", time: "6 min", category: "Santé Mentale", image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80", bookmarked: false, featured: false, desc: "Le stress impacte l'immunité. Techniques validées : méditation, yoga, thérapie cognitivo-comportementale." },

  // Activité Physique
  { id: 13, title: "Marche et VIH : bienfaits de l'activité physique", type: "Article", time: "4 min", category: "Activité Physique", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", bookmarked: true,  featured: false, desc: "30 min/jour de marche améliore les CD4 et la qualité de vie. Les preuves." },
  { id: 14, title: "Programme sport 8 semaines pour PVVIH", type: "Vidéo",   time: "20 min", category: "Activité Physique", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80", bookmarked: false, featured: true,  desc: "Un programme progressif validé par des médecins infectiologues." },
  { id: 15, title: "Fatigue chronique et VIH : comment reprendre de l'énergie", type: "Article", time: "5 min", category: "Activité Physique", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", bookmarked: false, featured: false, desc: "Distinguer fatigue ARV, fatigue virale et syndrome de déconditionnement." },
  { id: 34, title: "Yoga et VIH : postures adaptées pour l'immunité", type: "Vidéo", time: "25 min", category: "Activité Physique", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", bookmarked: false, featured: false, desc: "Séquence de 20 postures accessibles, adaptées aux PVVIH, avec explication des bénéfices immunologiques." },
  { id: 35, title: "Natation et sport aquatique pour les PVVIH", type: "Article", time: "4 min", category: "Activité Physique", image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80", bookmarked: false, featured: false, desc: "La natation est l'activité la plus complète pour préserver muscle, articulatios et immunité." },

  // Vie Intime
  { id: 16, title: "Indétectable = Intransmissible (I=I) : la science", type: "Article", time: "6 min", category: "Vie Intime", image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80", bookmarked: false, featured: true,  desc: "L'étude PARTNER2 l'a confirmé : charge virale indétectable = zéro risque de transmission." },
  { id: 17, title: "Désir d'enfant et VIH : ce qui est possible", type: "Article", time: "8 min", category: "Vie Intime", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80", bookmarked: false, featured: false, desc: "PTME, sérodifférence, PrEP : les options pour avoir un enfant séronégatif." },
  { id: 18, title: "Contraception et ARV : les interactions à connaître", type: "Article", time: "5 min", category: "Vie Intime", image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&q=80", bookmarked: false, featured: false, desc: "Certains ARV réduisent l'efficacité des pilules hormonales. Ce qu'il faut savoir." },
  { id: 36, title: "Libido et traitement ARV : causes et solutions", type: "Article", time: "5 min", category: "Vie Intime", image: "https://images.unsplash.com/photo-1521316730702-829a8e30dfd0?w=800&q=80", bookmarked: false, featured: false, desc: "Certains ARV affectent la libido. Solutions médicales et approches non médicamenteuses." },
  { id: 37, title: "Couple sérodifférent : construire une relation épanouissante", type: "Article", time: "7 min", category: "Vie Intime", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80", bookmarked: false, featured: false, desc: "Communication, PrEP pour le partenaire séronégatif, suivi médical conjoint : guide pratique." },

  // Droits & Social
  { id: 19, title: "Droits des PVVIH au Sénégal : ce que dit la loi", type: "Article", time: "10 min", category: "Droits & Social", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80", bookmarked: false, featured: false, desc: "Loi 2010-03, confidentialité médicale, protection contre la discrimination." },
  { id: 20, title: "Associations de soutien aux PVVIH au Sénégal", type: "Article", time: "5 min", category: "Droits & Social", image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80", bookmarked: false, featured: false, desc: "ANCS, RNP+, SWAA-Sénégal : annuaire des associations et leurs services." },
  { id: 38, title: "VIH et emploi : vos droits au travail", type: "Article", time: "6 min", category: "Droits & Social", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80", bookmarked: false, featured: false, desc: "Confidentialité médicale, aménagements de poste, licenciement abusif : ce que la loi vous garantit." },
  { id: 39, title: "Accès aux soins et couverture santé pour les PVVIH", type: "Article", time: "7 min", category: "Droits & Social", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", bookmarked: false, featured: false, desc: "CMU, assurance maladie, gratuité des ARV : tout ce à quoi vous avez droit au Sénégal." },
  { id: 40, title: "Stigmatisation scolaire : protéger vos enfants PVVIH", type: "Article", time: "5 min", category: "Droits & Social", image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80", bookmarked: false, featured: false, desc: "Vos enfants ont droit à l'éducation. Comment gérer les situations de discrimination à l'école." },

  // Prévention
  { id: 41, title: "La PrEP en pratique : qui, comment, où au Sénégal", type: "Article", time: "6 min", category: "Prévention", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80", bookmarked: false, featured: true,  desc: "Prophylaxie pré-exposition : éligibilité, suivi, sites de prescription au Sénégal." },
  { id: 42, title: "Le préservatif masculin et féminin : utilisation correcte", type: "Vidéo", time: "5 min", category: "Prévention", image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&q=80", bookmarked: false, featured: false, desc: "Démonstration étape par étape pour une protection optimale. Erreurs à éviter." },
  { id: 43, title: "Dépistage VIH : pourquoi se faire tester régulièrement", type: "Article", time: "4 min", category: "Prévention", image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80", bookmarked: false, featured: false, desc: "Sites de dépistage gratuits et confidentiels, auto-tests, fréquence recommandée." },
  { id: 44, title: "TPE (Traitement Post-Exposition) : les 72 heures cruciales", type: "Article", time: "5 min", category: "Prévention", image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80", bookmarked: false, featured: false, desc: "En cas d'exposition accidentelle, le TPE dans les 72h peut empêcher l'infection. Mode d'emploi." },
  { id: 45, title: "PTME : prévenir la transmission mère-enfant", type: "Article", time: "7 min", category: "Prévention", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80", bookmarked: false, featured: false, desc: "Protocole national sénégalais de PTME, suivi de grossesse, allaitement et alternatives." },
  { id: 46, title: "Réduction des risques chez les usagers de drogues", type: "Article", time: "6 min", category: "Prévention", image: "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=800&q=80", bookmarked: false, featured: false, desc: "Échange de seringues, naloxone, centres d'accueil : ressources disponibles au Sénégal." },

  // Maternité & Famille
  { id: 47, title: "Grossesse et VIH : suivi médical complet", type: "Article", time: "9 min", category: "Maternité", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80", bookmarked: false, featured: true,  desc: "ARV pendant la grossesse, examens prénataux, accouchement : guide trimestre par trimestre." },
  { id: 48, title: "Allaitement maternel et VIH : recommandations 2024", type: "Article", time: "5 min", category: "Maternité", image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80", bookmarked: false, featured: false, desc: "L'OMS recommande l'allaitement sous ARV dans les contextes à risque. Ce que ça signifie pour vous." },
  { id: 49, title: "Enfant exposé au VIH : suivi pédiatrique", type: "Article", time: "6 min", category: "Maternité", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80", bookmarked: false, featured: false, desc: "Protocole de prophylaxie néonatale, tests PCR, vaccinations adaptées et suivi jusqu'à 18 mois." },
  { id: 50, title: "ARV et fertilité masculine : impact et solutions", type: "Article", time: "5 min", category: "Maternité", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80", bookmarked: false, featured: false, desc: "Certains ARV peuvent affecter la qualité du sperme. Options pour les hommes qui souhaitent avoir des enfants." },

  // Bien-être
  { id: 51, title: "Sommeil et VIH : améliorer la qualité du repos", type: "Article", time: "5 min", category: "Bien-être", image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80", bookmarked: false, featured: false, desc: "Les troubles du sommeil touchent 70% des PVVIH. Hygiène du sommeil, traitement des insomnies." },
  { id: 52, title: "Méditation guidée pour PVVIH : séance de 10 minutes", type: "Vidéo", time: "10 min", category: "Bien-être", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", bookmarked: false, featured: true, desc: "Séance de pleine conscience guidée, spécialement conçue pour les personnes vivant avec une maladie chronique." },
  { id: 53, title: "Jardinage thérapeutique et santé mentale", type: "Article", time: "4 min", category: "Bien-être", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", bookmarked: false, featured: false, desc: "Le jardinage réduit le cortisol, améliore l'humeur et renforce le sentiment d'accomplissement." },
  { id: 54, title: "Voyager avec le VIH : conseils pratiques et règlementaires", type: "Article", time: "7 min", category: "Bien-être", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80", bookmarked: false, featured: false, desc: "Pays avec restrictions d'entrée, transport des médicaments, gestion du décalage horaire." },
  { id: 55, title: "Tabac, alcool et VIH : doubles risques à connaître", type: "Article", time: "5 min", category: "Bien-être", image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80", bookmarked: false, featured: false, desc: "Le tabac aggrave les effets des ARV sur les poumons et le cœur. Guide pour arrêter avec un accompagnement adapté." },
];

const CTA_LIST = [
  // Dakar
  { name: "CTA Hôpital de Fann", address: "Avenue Cheikh Anta Diop, Dakar", phone: "33 869 18 18", horaires: "Lun–Ven 8h–17h", region: "Dakar", services: ["Consultation", "ARV", "Psychologue", "Pédiatrie", "PTME", "Labo"] },
  { name: "CTA Hôpital Principal de Dakar", address: "Avenue Nelson Mandela, Dakar", phone: "33 839 50 50", horaires: "Lun–Ven 8h–17h", region: "Dakar", services: ["Consultation", "ARV", "Labo", "Dermato"] },
  { name: "CTA Hôpital Aristide Le Dantec", address: "Rue Aimé Césaire, Dakar", phone: "33 889 26 26", horaires: "Lun–Ven 8h–17h", region: "Dakar", services: ["Consultation", "ARV", "Dermato", "Psychologue"] },
  { name: "CTA Hôpital Abass Ndao", address: "Rue Aimé Césaire x Rue 19, Dakar", phone: "33 849 91 91", horaires: "Lun–Sam 8h–16h", region: "Dakar", services: ["Consultation", "ARV", "PTME", "Labo"] },
  { name: "CTA Hôpital de Pikine", address: "Route de Rufisque, Pikine", phone: "33 834 62 62", horaires: "Lun–Ven 8h–16h", region: "Dakar", services: ["Consultation", "ARV"] },
  { name: "CTA Hôpital Général de Grand-Yoff", address: "HOGGY, Dakar", phone: "33 867 67 67", horaires: "Lun–Ven 8h–17h", region: "Dakar", services: ["Consultation", "ARV", "Médecine interne", "Pédiatrie"] },
  { name: "Centre de Santé de Médina", address: "Rue 19 x Rue 20, Médina, Dakar", phone: "33 822 05 05", horaires: "Lun–Sam 8h–16h", region: "Dakar", services: ["Consultation", "ARV", "PTME"] },
  { name: "CTA Hôpital Albert Royer", address: "Fann, Dakar", phone: "33 825 22 72", horaires: "Lun–Ven 8h–16h", region: "Dakar", services: ["Consultation pédiatrique", "ARV Enfant", "PTME", "Labo"] },
  // Ziguinchor
  { name: "CTA Hôpital Régional de Ziguinchor", address: "Quartier Lyndiane, Ziguinchor", phone: "33 991 21 21", horaires: "Lun–Ven 8h–16h", region: "Ziguinchor", services: ["Consultation", "ARV", "Psychologue", "Labo"] },
  { name: "CTA District Sanitaire Oussouye", address: "Centre de Santé d'Oussouye", phone: "33 993 10 10", horaires: "Lun–Ven 8h–14h", region: "Ziguinchor", services: ["Consultation", "ARV"] },
  { name: "Centre de Santé de Bignona", address: "Bignona, Ziguinchor", phone: "33 994 10 10", horaires: "Lun–Ven 8h–14h", region: "Ziguinchor", services: ["Consultation", "ARV", "PTME"] },
  // Saint-Louis
  { name: "CTA Hôpital Régional de Saint-Louis", address: "Boulevard Général de Gaulle, Saint-Louis", phone: "33 961 11 11", horaires: "Lun–Ven 8h–16h", region: "Saint-Louis", services: ["Consultation", "ARV", "Labo", "Pédiatrie"] },
  { name: "Centre de Santé de Dagana", address: "Dagana, Saint-Louis", phone: "33 963 10 10", horaires: "Lun–Ven 8h–14h", region: "Saint-Louis", services: ["Consultation", "ARV"] },
  // Kaolack
  { name: "CTA Hôpital Régional de Kaolack", address: "Avenue Lamine Guèye, Kaolack", phone: "33 941 10 10", horaires: "Lun–Ven 8h–16h", region: "Kaolack", services: ["Consultation", "ARV", "Pédiatrie", "PTME"] },
  { name: "Centre de Santé de Gossas", address: "Gossas, Kaolack", phone: "33 945 10 10", horaires: "Lun–Ven 8h–14h", region: "Kaolack", services: ["Consultation", "ARV"] },
  // Thiès
  { name: "CTA Hôpital Régional de Thiès", address: "Avenue Lamine Guèye, Thiès", phone: "33 951 14 14", horaires: "Lun–Ven 8h–16h", region: "Thiès", services: ["Consultation", "ARV", "Labo"] },
  { name: "CTA Hôpital de Mbour", address: "Mbour, Thiès", phone: "33 957 11 11", horaires: "Lun–Ven 8h–16h", region: "Thiès", services: ["Consultation", "ARV", "PTME"] },
  { name: "Centre de Santé de Tivaouane", address: "Tivaouane, Thiès", phone: "33 955 10 10", horaires: "Lun–Ven 8h–14h", region: "Thiès", services: ["Consultation", "ARV"] },
  // Kolda
  { name: "CTA Hôpital Régional de Kolda", address: "Quartier Escale, Kolda", phone: "33 996 10 10", horaires: "Lun–Ven 8h–14h", region: "Kolda", services: ["Consultation", "ARV", "PTME", "Labo"] },
  { name: "Centre de Santé de Vélingara", address: "Vélingara, Kolda", phone: "33 997 10 10", horaires: "Lun–Ven 8h–14h", region: "Kolda", services: ["Consultation", "ARV"] },
  // Tambacounda
  { name: "CTA Hôpital Régional de Tambacounda", address: "Avenue Léopold Sédar Senghor, Tamba", phone: "33 981 10 10", horaires: "Lun–Ven 8h–15h", region: "Tambacounda", services: ["Consultation", "ARV", "Labo"] },
  { name: "Centre de Santé de Bakel", address: "Bakel, Tambacounda", phone: "33 983 10 10", horaires: "Lun–Ven 8h–14h", region: "Tambacounda", services: ["Consultation", "ARV"] },
  // Sédhiou
  { name: "CTA District Sanitaire de Sédhiou", address: "Centre de Santé de Sédhiou", phone: "33 995 11 11", horaires: "Lun–Ven 8h–14h", region: "Sédhiou", services: ["Consultation", "ARV", "PTME"] },
  // Matam
  { name: "CTA Hôpital Régional de Matam", address: "Quartier Ourossogui, Matam", phone: "33 966 10 10", horaires: "Lun–Ven 8h–14h", region: "Matam", services: ["Consultation", "ARV"] },
  { name: "Centre de Santé de Kanel", address: "Kanel, Matam", phone: "33 967 10 10", horaires: "Lun–Ven 8h–14h", region: "Matam", services: ["Consultation", "ARV"] },
  // Diourbel
  { name: "CTA Hôpital Régional de Diourbel", address: "Avenue Bourguiba, Diourbel", phone: "33 971 10 10", horaires: "Lun–Ven 8h–16h", region: "Diourbel", services: ["Consultation", "ARV", "Labo", "Pédiatrie"] },
  { name: "Centre de Santé de Mbacké", address: "Mbacké, Diourbel", phone: "33 976 10 10", horaires: "Lun–Ven 8h–14h", region: "Diourbel", services: ["Consultation", "ARV", "PTME"] },
  // Louga
  { name: "CTA Hôpital Régional de Louga", address: "Louga centre", phone: "33 967 10 10", horaires: "Lun–Ven 8h–16h", region: "Louga", services: ["Consultation", "ARV", "Labo"] },
  { name: "Centre de Santé de Linguère", address: "Linguère, Louga", phone: "33 968 10 10", horaires: "Lun–Ven 8h–14h", region: "Louga", services: ["Consultation", "ARV"] },
  // Fatick
  { name: "CTA Hôpital Régional de Fatick", address: "Fatick centre", phone: "33 949 10 10", horaires: "Lun–Ven 8h–16h", region: "Fatick", services: ["Consultation", "ARV", "PTME", "Labo"] },
  { name: "Centre de Santé de Foundiougne", address: "Foundiougne, Fatick", phone: "33 948 10 10", horaires: "Lun–Ven 8h–14h", region: "Fatick", services: ["Consultation", "ARV"] },
  // Kédougou
  { name: "CTA Hôpital Régional de Kédougou", address: "Kédougou centre", phone: "33 985 10 10", horaires: "Lun–Ven 8h–14h", region: "Kédougou", services: ["Consultation", "ARV", "Labo"] },
];

const FAQ = [
  { q: "Qu'est-ce que le VIH et comment se transmet-il ?", r: "Le VIH (Virus de l'Immunodéficience Humaine) se transmet par contact avec certains fluides corporels : sang, lait maternel, sperme ou sécrétions vaginales. Il ne se transmet PAS par l'air, l'eau, les poignées de main, les moustiques ou le partage de repas.", category: "Bases" },
  { q: "Quelle est la différence entre VIH et SIDA ?", r: "Le VIH est le virus. Le SIDA est le stade avancé de l'infection, quand le système immunitaire est très affaibli (CD4 < 200/mm³). Avec un traitement ARV efficace, on peut vivre avec le VIH sans jamais développer le SIDA.", category: "Bases" },
  { q: "Comment se fait le diagnostic du VIH ?", r: "Le diagnostic se fait par test sérologique (ELISA, test rapide) détectant les anticorps anti-VIH. Le test est positif après la 'fenêtre sérologique' (4 à 12 semaines après l'exposition). Le test PCR détecte le virus plus tôt (10–15 jours). Tests gratuits et confidentiels dans tous les CTA et CDVA.", category: "Bases" },
  { q: "Qu'est-ce que l'observance thérapeutique ?", r: "L'observance, c'est prendre ses médicaments ARV tous les jours, à la même heure, sans oublier. Une bonne observance (>95%) maintient la charge virale indétectable, protège votre santé et empêche la transmission. Un seul oubli par mois peut suffire à faire rebondir la charge virale.", category: "Traitement" },
  { q: "Quels sont les effets secondaires courants des ARV ?", r: "Les effets secondaires varient selon le traitement : nausées, fatigue, maux de tête (souvent temporaires dans les premières semaines). Plus rarement : effets rénaux, hépatiques ou cardiovasculaires. Parlez-en toujours à votre soignant CTA avant d'arrêter le traitement.", category: "Traitement" },
  { q: "Que faire si j'oublie une prise ?", r: "Si vous réalisez l'oubli dans les 12h : prenez le comprimé immédiatement. Au-delà de 12h : sautez la dose et reprenez normalement le lendemain. Ne doublez jamais la dose. Signalez l'oubli à votre médecin lors de la prochaine consultation.", category: "Traitement" },
  { q: "Qu'est-ce que la charge virale indétectable ?", r: "Quand la charge virale est < 50 copies/mL de sang, on dit qu'elle est indétectable. Cela signifie que le virus est sous contrôle. Une personne indétectable ne transmet pas le VIH à ses partenaires (principe I=I, prouvé par l'étude PARTNER2 en 2019).", category: "Traitement" },
  { q: "Comment fonctionne le suivi médical au CTA ?", r: "Le suivi standard comprend : consultation médicale tous les 3–6 mois, bilan CD4 et charge virale 2×/an, bilan hépatique et rénal annuel. L'accès aux ARV est gratuit au Sénégal. En cas de problème, vous pouvez consulter hors rendez-vous.", category: "Traitement" },
  { q: "Quand faut-il changer de traitement ARV ?", r: "Le changement de traitement est indiqué en cas d'échec virologique (charge virale > 1 000 copies/mL malgré une bonne observance), d'effets secondaires intolérables, ou de grossesse. Ce changement se fait toujours sur décision médicale avec un test de résistance.", category: "Traitement" },
  { q: "Peut-on avoir une vie normale avec le VIH ?", r: "Oui. Avec un traitement ARV efficace et une charge virale indétectable, on peut vivre longtemps, avoir des enfants séronégatifs, travailler, aimer et voyager sans restriction. Le VIH est aujourd'hui une maladie chronique gérable comme le diabète ou l'hypertension.", category: "Vie quotidienne" },
  { q: "Peut-on transmettre le VIH à son/sa partenaire ?", r: "Non, si votre charge virale est indétectable depuis au moins 6 mois (principe I=I). Par ailleurs, le préservatif protège à 98% s'il est utilisé correctement. La PrEP est également disponible pour les partenaires séronégatifs.", category: "Vie quotidienne" },
  { q: "Peut-on avoir des enfants en étant séropositif(ve) ?", r: "Oui. Grâce à la PTME, le risque de transmettre le VIH à l'enfant est inférieur à 1% si la mère est sous traitement efficace. Les couples sérodifférents ont également plusieurs options médicales pour concevoir sans risque.", category: "Vie quotidienne" },
  { q: "Peut-on voyager à l'étranger avec ses médicaments ARV ?", r: "Oui, avec précautions : emportez plus de médicaments que nécessaire, conservez une ordonnance traduite si besoin, transportez les médicaments en bagage cabine. Certains pays imposent des restrictions d'entrée aux PVVIH — vérifiez avant de partir.", category: "Vie quotidienne" },
  { q: "VIH et alcool : quels risques ?", r: "L'alcool en excès affaiblit le système immunitaire, interfère avec l'efficacité des ARV et augmente les effets secondaires hépatiques. Une consommation modérée (1 verre/jour) est généralement tolérée, mais l'abstinence est recommandée.", category: "Vie quotidienne" },
  { q: "Comment gérer la stigmatisation ?", r: "La stigmatisation est réelle et douloureuse, mais elle repose sur l'ignorance. Des associations comme RNP+ et ANCS offrent soutien juridique et psychologique. Il n'y a aucune obligation légale de divulguer votre statut à votre employeur.", category: "Soutien" },
  { q: "Où trouver du soutien psychologique au Sénégal ?", r: "Les CTA proposent des consultants psychologiques gratuits. L'association ANCS (Alliance Nationale Contre le Sida) offre du soutien. La ligne Gindima 800 00 30 30 est disponible 24h/24 gratuitement et en toute confidentialité.", category: "Soutien" },
  { q: "Existe-t-il des groupes de parole pour les PVVIH ?", r: "Oui, l'association RNP+ (Réseau National des Personnes Vivant avec le VIH) organise des groupes de parole dans plusieurs villes. SWAA-Sénégal anime des groupes spécifiques pour les femmes. Ces groupes sont confidentiels et gratuits.", category: "Soutien" },
  { q: "Comment aider un proche qui vient d'apprendre son diagnostic ?", r: "Soyez présent sans envahir. Informez-vous sur le VIH pour dépasser vos propres préjugés. Ne divulguez pas son statut. Encouragez-le à consulter un psychologue et à rejoindre un groupe de soutien. Ne prenez pas de décisions médicales à sa place.", category: "Soutien" },
  { q: "La PrEP est-elle disponible au Sénégal ?", r: "Oui. La PrEP est disponible dans plusieurs CTA et centres de santé au Sénégal, notamment à Dakar. Elle est réservée aux personnes séronégatives à haut risque et doit être prescrite et suivie par un médecin.", category: "Prévention" },
  { q: "Qu'est-ce que le TPE et quand l'utiliser ?", r: "Le TPE (Traitement Post-Exposition) est un traitement d'urgence à débuter dans les 72h suivant une exposition au VIH (rapport non protégé, accident d'exposition au sang, agression sexuelle). Il dure 28 jours. Disponible aux urgences des hôpitaux.", category: "Prévention" },
  { q: "Comment se protéger en couple sérodifférent ?", r: "Trois stratégies cumulables : 1) ARV avec charge virale indétectable pour le partenaire séropositif (I=I) ; 2) PrEP pour le partenaire séronégatif ; 3) Préservatif. Le suivi médical conjoint est fortement recommandé.", category: "Prévention" },
  { q: "Le préservatif protège-t-il aussi contre les autres IST ?", r: "Oui. Le préservatif protège efficacement contre la gonorrhée, chlamydia, syphilis, hépatites B et C. Ces IST peuvent accélérer la progression du VIH et doivent être dépistées régulièrement (1–2×/an pour les PVVIH actifs sexuellement).", category: "Prévention" },
];

const CATEGORIES = [
  { name: "Traitements",       icon: Pill,      color: "bg-teal-100 text-teal-700",    border: "border-teal-200",   count: ALL_ARTICLES.filter(a => a.category === "Traitements").length },
  { name: "Nutrition",         icon: Apple,     color: "bg-orange-100 text-orange-700", border: "border-orange-200", count: ALL_ARTICLES.filter(a => a.category === "Nutrition").length },
  { name: "Santé Mentale",     icon: Brain,     color: "bg-purple-100 text-purple-700", border: "border-purple-200", count: ALL_ARTICLES.filter(a => a.category === "Santé Mentale").length },
  { name: "Activité Physique", icon: Activity,  color: "bg-blue-100 text-blue-700",    border: "border-blue-200",   count: ALL_ARTICLES.filter(a => a.category === "Activité Physique").length },
  { name: "Vie Intime",        icon: Heart,     color: "bg-pink-100 text-pink-700",    border: "border-pink-200",   count: ALL_ARTICLES.filter(a => a.category === "Vie Intime").length },
  { name: "Droits & Social",   icon: Shield,    color: "bg-indigo-100 text-indigo-700", border: "border-indigo-200", count: ALL_ARTICLES.filter(a => a.category === "Droits & Social").length },
  { name: "Prévention",        icon: Syringe,   color: "bg-cyan-100 text-cyan-700",    border: "border-cyan-200",   count: ALL_ARTICLES.filter(a => a.category === "Prévention").length },
  { name: "Maternité",         icon: Baby,      color: "bg-rose-100 text-rose-700",    border: "border-rose-200",   count: ALL_ARTICLES.filter(a => a.category === "Maternité").length },
  { name: "Bien-être",         icon: Sun,       color: "bg-amber-100 text-amber-700",  border: "border-amber-200",  count: ALL_ARTICLES.filter(a => a.category === "Bien-être").length },
];

const FAQ_CATEGORIES = ["Tout", "Bases", "Traitement", "Vie quotidienne", "Soutien", "Prévention"];

const CTA_REGIONS = ["Tout", "Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor", "Kolda", "Tambacounda", "Diourbel", "Louga", "Fatick", "Matam", "Sédhiou", "Kédougou"];

const REGION_COLORS: Record<string, string> = {
  Dakar: "bg-blue-100 text-blue-700",
  Ziguinchor: "bg-green-100 text-green-700",
  "Saint-Louis": "bg-orange-100 text-orange-700",
  Kaolack: "bg-purple-100 text-purple-700",
  Thiès: "bg-teal-100 text-teal-700",
  Kolda: "bg-red-100 text-red-700",
  Tambacounda: "bg-amber-100 text-amber-700",
  Sédhiou: "bg-lime-100 text-lime-700",
  Matam: "bg-cyan-100 text-cyan-700",
  Diourbel: "bg-violet-100 text-violet-700",
  Louga: "bg-sky-100 text-sky-700",
  Fatick: "bg-emerald-100 text-emerald-700",
  Kédougou: "bg-yellow-100 text-yellow-700",
};

const USEFUL_LINKS = [
  { name: "CNLS Sénégal", desc: "Comité National de Lutte contre le Sida — actualités, chiffres officiels", url: "http://cnls.sn", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "ANCS", desc: "Alliance Nationale Contre le Sida — soutien juridique et psychologique", url: "http://ancs.sn", icon: HeartHandshake, color: "text-rose-600", bg: "bg-rose-50" },
  { name: "RNP+", desc: "Réseau National des Personnes Vivant avec le VIH — groupes de parole", url: "http://rnpplus.sn", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  { name: "SWAA-Sénégal", desc: "Société des Femmes contre le SIDA en Afrique — groupes femmes", url: "#", icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
  { name: "OMS — VIH/SIDA", desc: "Recommandations mondiales, directives thérapeutiques, données épidémiologiques", url: "https://www.who.int/fr/news-room/fact-sheets/detail/hiv-aids", icon: Globe, color: "text-teal-600", bg: "bg-teal-50" },
  { name: "ONUSIDA", desc: "Programme commun des Nations Unies sur le VIH/SIDA — rapport mondial", url: "https://www.unaids.org/fr", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
  { name: "Aidsmap", desc: "Base de données d'articles médicaux sur le VIH (en anglais et français)", url: "https://www.aidsmap.com/fr", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
  { name: "Sidaction", desc: "Association française de recherche et de soutien sur le VIH", url: "https://www.sidaction.org", icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
];

const HOTLINES = [
  { name: "Ligne Gindima", desc: "Soutien psychologique & orientation CTA", phone: "800 003 030", available: "24h/24 · Gratuit", color: "bg-[#FF6B6B]", badge: "Urgence" },
  { name: "CNLS — Info VIH", desc: "Informations sur le VIH, prévention, dépistage", phone: "800 00 1717", available: "Lun–Ven 8h–17h · Gratuit", color: "bg-[#10AC84]", badge: "Info" },
  { name: "Sida Info Service", desc: "Écoute et conseils (francophone international)", phone: "+33 800 840 800", available: "24h/24", color: "bg-blue-500", badge: "International" },
  { name: "Stop Sida", desc: "Prévention, dépistage, orientation", phone: "800 00 2020", available: "Lun–Sam 8h–18h · Gratuit", color: "bg-purple-500", badge: "Prévention" },
];

const GUIDES = [
  { title: "Guide du patient VIH — Sénégal 2024", desc: "Manuel complet pour les PVVIH : traitement, suivi, droits", pages: "48 pages", icon: BookMarked, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Livret I=I : Indétectable = Intransmissible", desc: "Explication scientifique du principe I=I pour vous et vos proches", pages: "12 pages", icon: Microscope, color: "text-teal-600", bg: "bg-teal-50" },
  { title: "Calendrier de suivi médical", desc: "Tableau des examens biologiques recommandés avec dates", pages: "2 pages", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Guide nutrition & ARV", desc: "Aliments à privilégier, interactions, recettes sénégalaises adaptées", pages: "24 pages", icon: Apple, color: "text-orange-600", bg: "bg-orange-50" },
  { title: "Droits des PVVIH au Sénégal", desc: "Résumé des lois de protection, recours juridiques disponibles", pages: "16 pages", icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50" },
  { title: "Guide grossesse & VIH (PTME)", desc: "Protocole de prévention de la transmission mère-enfant", pages: "20 pages", icon: Baby, color: "text-rose-600", bg: "bg-rose-50" },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function Resources() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set(ALL_ARTICLES.filter(a => a.bookmarked).map(a => a.id)));
  const [tab, setTab] = useState<"articles" | "cta" | "faq" | "outils">("articles");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqCategory, setFaqCategory] = useState("Tout");
  const [ctaRegion, setCtaRegion] = useState("Tout");
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const filteredArticles = ALL_ARTICLES.filter(a => {
    const matchSearch = search === "" || a.title.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === null || a.category === activeCategory;
    const matchBookmark = !showBookmarksOnly || bookmarks.has(a.id);
    return matchSearch && matchCat && matchBookmark;
  });

  const featuredArticles = ALL_ARTICLES.filter(a => a.featured);

  const filteredFaq = FAQ.filter(f =>
    (faqCategory === "Tout" || f.category === faqCategory) &&
    (search === "" || f.q.toLowerCase().includes(search.toLowerCase()) || f.r.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredCta = CTA_LIST.filter(c =>
    (ctaRegion === "Tout" || c.region === ctaRegion) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase()))
  );

  function toggleBookmark(id: number) {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const catColors: Record<string, string> = {
    Bases: "bg-blue-100 text-blue-700",
    Traitement: "bg-teal-100 text-teal-700",
    "Vie quotidienne": "bg-green-100 text-green-700",
    Soutien: "bg-purple-100 text-purple-700",
    Prévention: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex flex-col min-h-full font-sans bg-gray-50 pb-28">

      {/* ── Header ── */}
      <div className="bg-white px-5 pt-4 pb-3 shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-0.5">
          Ressources <BookOpen className="w-5 h-5 text-blue-500" />
        </h2>
        <p className="text-xs font-medium text-gray-500 mb-3">Informez-vous, comprenez, agissez.</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher articles, FAQ, CTA..."
            className="w-full bg-gray-100 text-sm font-medium rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {(["articles", "cta", "faq", "outils"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tab === t ? "bg-blue-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {t === "articles" ? `Articles (${ALL_ARTICLES.length})` : t === "cta" ? `CTA (${CTA_LIST.length})` : t === "faq" ? `FAQ (${FAQ.length})` : "Outils"}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          ARTICLES TAB
      ══════════════════════════════════════ */}
      {tab === "articles" && (
        <div className="p-5 flex flex-col gap-6">

          {/* À la une — carousel */}
          {!activeCategory && !showBookmarksOnly && search === "" && (
            <div>
              <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> À la une
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 snap-x">
                {featuredArticles.map(article => {
                  const cat = CATEGORIES.find(c => c.name === article.category);
                  return (
                    <div key={article.id} className="w-[280px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-gray-100 snap-center relative group bg-white">
                      <div className="h-40 bg-gray-200 relative overflow-hidden">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat?.color || "bg-gray-100 text-gray-600"}`}>{article.category}</span>
                          <h4 className="text-sm font-extrabold text-white mt-1 leading-tight line-clamp-2">{article.title}</h4>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          {article.type === "Vidéo" ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {article.type}
                        </div>
                        <button onClick={() => toggleBookmark(article.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                          <Bookmark className={`w-3.5 h-3.5 ${bookmarks.has(article.id) ? "fill-white text-white" : "text-white"}`} />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">{article.desc}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {article.time}</span>
                          <button className="text-[10px] font-bold text-blue-500 flex items-center gap-0.5">Lire <ArrowUpRight className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtres bookmarks */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${showBookmarksOnly ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200"}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? "fill-white" : ""}`} /> Mes favoris ({bookmarks.size})
            </button>
            {showBookmarksOnly && (
              <button onClick={() => setShowBookmarksOnly(false)} className="text-xs font-bold text-gray-400 underline">Tout afficher</button>
            )}
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3">Parcourir par thème</h3>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(isActive ? null : cat.name)}
                    className={`p-3 rounded-xl flex items-center justify-between border transition-all ${isActive ? cat.color + " " + cat.border + " scale-[0.98]" : "bg-white border-gray-100 hover:opacity-90"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? cat.color.split(" ")[1] : "text-gray-400"}`} />
                      <span className={`text-sm font-bold ${isActive ? cat.color.split(" ")[1] : "text-gray-700"}`}>{cat.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-white/50" : "bg-gray-100 text-gray-500"}`}>{cat.count}</span>
                  </button>
                );
              })}
            </div>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="mt-2 text-xs font-bold text-gray-500 underline">✕ Effacer le filtre</button>
            )}
          </div>

          {/* Liste d'articles */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center justify-between">
              <span>{activeCategory || (showBookmarksOnly ? "Mes favoris" : "Tous les articles")}</span>
              <span className="text-xs font-bold text-blue-500">{filteredArticles.length} résultat{filteredArticles.length > 1 ? "s" : ""}</span>
            </h3>
            {filteredArticles.length === 0 && (
              <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium">Aucun article trouvé.</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {filteredArticles.map(article => {
                const cat = CATEGORIES.find(c => c.name === article.category);
                return (
                  <div key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex group">
                    <div className="w-24 h-24 bg-gray-200 relative overflow-hidden shrink-0">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {article.type === "Vidéo" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cat?.color || "bg-gray-100 text-gray-500"}`}>{article.category}</span>
                          {bookmarks.has(article.id) && <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">{article.title}</h4>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {article.time}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleBookmark(article.id)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <Bookmark className={`w-3.5 h-3.5 ${bookmarks.has(article.id) ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                          </button>
                          <button className="text-[10px] font-bold text-blue-500 flex items-center gap-0.5">Lire <ArrowUpRight className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bannière statistiques */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <h4 className="text-sm font-extrabold">Sénégal — Chiffres clés 2023</h4>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { value: "0.34%", label: "Prévalence nationale" },
                { value: "85%", label: "Sous traitement ARV" },
                { value: "32", label: "CTAs actifs" },
              ].map(s => (
                <div key={s.label} className="bg-white/20 rounded-xl p-2 text-center">
                  <p className="text-base font-black">{s.value}</p>
                  <p className="text-[9px] font-medium text-white/80 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-medium text-white/70 mt-2">Source : CNLS Sénégal 2023</p>
          </div>

          {/* Bannière FAQ */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-purple-100">
              <HelpCircle className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-900">{FAQ.length} questions, {FAQ.length} réponses</h4>
              <p className="text-xs font-medium text-purple-700/80 mb-2 leading-tight">Notre FAQ couvre toutes les questions fréquentes sur le VIH.</p>
              <button onClick={() => setTab("faq")} className="text-xs font-bold bg-purple-600 text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-purple-700 transition-colors">
                Voir la FAQ →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CTA TAB
      ══════════════════════════════════════ */}
      {tab === "cta" && (
        <div className="p-5 flex flex-col gap-4">

          {/* Ligne urgence */}
          <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B6B] rounded-full flex items-center justify-center shrink-0">
              <PhoneIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">Ligne Gindima — 24h/24 · Gratuit</p>
              <p className="text-xs font-medium text-gray-500">Soutien psychologique & orientation CTA</p>
            </div>
            <a href="tel:800003030" className="px-3 py-1.5 bg-[#FF6B6B] text-white text-xs font-bold rounded-full shadow-sm">
              800 003 030
            </a>
          </div>

          {/* Filtre région */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Filtrer par région</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CTA_REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setCtaRegion(r)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${ctaRegion === r ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm font-medium text-gray-500">{filteredCta.length} centre{filteredCta.length > 1 ? "s" : ""} trouvé{filteredCta.length > 1 ? "s" : ""}</p>

          {filteredCta.map((cta, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-sm text-gray-900 flex-1 pr-2 leading-tight">{cta.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${REGION_COLORS[cta.region] || "bg-gray-100 text-gray-600"}`}>{cta.region}</span>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-xs font-medium text-gray-500">{cta.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a href={`tel:${cta.phone}`} className="text-xs font-bold text-[#10AC84]">{cta.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs font-medium text-gray-500">{cta.horaires}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {cta.services.map(s => (
                  <span key={s} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#10AC84]" /> {s}
                  </span>
                ))}
              </div>
              <a href={`tel:${cta.phone}`} className="w-full py-2.5 rounded-xl bg-[#10AC84] text-white text-xs font-bold text-center shadow-sm flex items-center justify-center gap-1.5">
                <PhoneIcon className="w-3.5 h-3.5" /> Appeler ce CTA
              </a>
            </div>
          ))}

          {filteredCta.length === 0 && (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">Aucun CTA dans cette région.</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
              Les ARV sont distribués <strong>gratuitement</strong> dans tous les CTA au Sénégal. Munissez-vous de votre carnet de suivi lors de chaque visite.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          FAQ TAB
      ══════════════════════════════════════ */}
      {tab === "faq" && (
        <div className="p-5 flex flex-col gap-4">

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFaqCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${faqCategory === cat ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-gray-500">{filteredFaq.length} question{filteredFaq.length > 1 ? "s" : ""}</p>

          {filteredFaq.length === 0 && (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">Aucune question trouvée.</p>
            </div>
          )}

          {filteredFaq.map((f, i) => {
            const realIdx = FAQ.indexOf(f);
            const isOpen = openFaq === realIdx;
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : realIdx)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mr-2 ${catColors[f.category] || "bg-gray-100 text-gray-500"}`}>{f.category}</span>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug mt-1.5">{f.q}</h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-sm font-medium text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{f.r}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bannière IA */}
          <div className="bg-gradient-to-r from-[#10AC84]/10 to-blue-50 border border-[#10AC84]/20 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-[#10AC84]/20">
              <Brain className="w-6 h-6 text-[#10AC84]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Vous avez d'autres questions ?</h4>
              <p className="text-xs font-medium text-gray-500 mb-2 leading-tight">Notre assistant IA répond en temps réel, 24h/24.</p>
              <a href="/app/ai-assistant" className="text-xs font-bold bg-[#10AC84] text-white px-3 py-1.5 rounded-full shadow-sm inline-block">
                Poser une question →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          OUTILS TAB
      ══════════════════════════════════════ */}
      {tab === "outils" && (
        <div className="p-5 flex flex-col gap-6">

          {/* Numéros d'urgence */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-[#FF6B6B]" /> Numéros utiles
            </h3>
            <div className="flex flex-col gap-3">
              {HOTLINES.map((h, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className={`w-12 h-12 ${h.color} rounded-2xl flex items-center justify-center shrink-0`}>
                    <PhoneIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-900">{h.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${h.badge === "Urgence" ? "bg-red-100 text-red-700" : h.badge === "Info" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600"}`}>{h.badge}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 leading-tight">{h.desc}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{h.available}</p>
                  </div>
                  <a href={`tel:${h.phone.replace(/\s/g, "")}`} className="shrink-0 px-3 py-2 bg-gray-100 text-gray-800 text-xs font-black rounded-xl">
                    {h.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> Sites & Organisations
            </h3>
            <div className="flex flex-col gap-3">
              {USEFUL_LINKS.map((link, i) => {
                const Icon = link.icon;
                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 group"
                  >
                    <div className={`w-12 h-12 ${link.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${link.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{link.name}</p>
                      <p className="text-xs font-medium text-gray-500 leading-tight line-clamp-2">{link.desc}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Guides téléchargeables */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-purple-500" /> Guides & Brochures
            </h3>
            <div className="flex flex-col gap-3">
              {GUIDES.map((guide, i) => {
                const Icon = guide.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className={`w-12 h-12 ${guide.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${guide.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{guide.title}</p>
                      <p className="text-xs font-medium text-gray-500 leading-tight mt-0.5">{guide.desc}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{guide.pages}</p>
                    </div>
                    <button className="shrink-0 w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Download className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs font-medium text-gray-400 text-center mt-3">
              Les guides sont fournis par le CNLS, l'OMS et les associations partenaires.
            </p>
          </div>

          {/* Applications recommandées */}
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-500" /> Applications recommandées
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { name: "MyTherapy", desc: "Rappels médicaments, suivi de santé et journaux", platform: "iOS & Android", icon: "💊" },
                { name: "Medisafe", desc: "Gestion des ordonnances et interactions médicamenteuses", platform: "iOS & Android", icon: "🔔" },
                { name: "HIV iChart", desc: "Référentiel clinique pour PVVIH et soignants", platform: "iOS & Android", icon: "📊" },
                { name: "AIDSinfo", desc: "Informations officielles sur les traitements (NIH)", platform: "Web & Mobile", icon: "🔬" },
              ].map((app, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">{app.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{app.name}</p>
                    <p className="text-xs font-medium text-gray-500">{app.desc}</p>
                    <p className="text-[10px] font-bold text-teal-600 mt-0.5">{app.platform}</p>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-xl border border-teal-100">
                    Voir
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bannière IA */}
          <div className="bg-gradient-to-r from-[#10AC84]/10 to-blue-50 border border-[#10AC84]/20 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-[#10AC84]/20">
              <Zap className="w-6 h-6 text-[#10AC84]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Assistant IA disponible 24h/24</h4>
              <p className="text-xs font-medium text-gray-500 mb-2 leading-tight">Posez vos questions médicales en toute confidentialité.</p>
              <a href="/app/ai-assistant" className="text-xs font-bold bg-[#10AC84] text-white px-3 py-1.5 rounded-full shadow-sm inline-block">
                Démarrer une conversation →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
