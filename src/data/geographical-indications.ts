/** Seed source for backend/scripts/seedGeoIndications.ts — not used at runtime (public site uses API). */
export type GeoCategory =
  | "Süt Ürünleri"
  | "Yemekler"
  | "Çorbalar"
  | "Tatlılar"
  | "Tarım Ürünleri"
  | "Ekmek ve Hamur İşleri"
  | "Et Ürünleri"
  | "Dokuma ve El Sanatları"
  | "Taş ve Maden";

export interface GeographicalIndication {
  id: string;
  name: string;
  category: GeoCategory;
  type: "Tescilli Ürün" | "Mahreç İşareti" | "Menşe Adı";
  registration: string;
  district?: string;
  highlight?: boolean;
  story?: string;
}

export const geographicalIndications: GeographicalIndication[] = [
  {
    id: "civil-peynir",
    name: "Erzurum Civil Peyniri",
    category: "Süt Ürünleri",
    type: "Tescilli Ürün",
    registration: "11.09.2009 · 116",
    highlight: true,
    story: "Erzurum'un yüksek rakımlı yayla kültüründen gelen güçlü süt ürünleri kimliğinin en bilinen temsilcilerinden biri.",
  },
  { id: "asmali-yahni", name: "Erzurum Aşmalı Yahni", category: "Yemekler", type: "Tescilli Ürün", registration: "27.12.2021 · 985" },
  { id: "asotu", name: "Erzurum Aşotu", category: "Tarım Ürünleri", type: "Tescilli Ürün", registration: "12.09.2022 · 1220" },
  { id: "ayran-asi-corbasi", name: "Erzurum Ayran Aşı Çorbası", category: "Çorbalar", type: "Tescilli Ürün", registration: "13.04.2022 · 1074" },
  { id: "ayva-yahnisi", name: "Erzurum Ayva Yahnisi / Kalyesi", category: "Yemekler", type: "Tescilli Ürün", registration: "16.02.2023 · 1339" },
  { id: "babaanne-pastasi", name: "Erzurum Babaanne Pastası / Erzurum Pastası", category: "Tatlılar", type: "Tescilli Ürün", registration: "01.10.2024 · 1642" },
  { id: "burmasi", name: "Erzurum Burması", category: "Tatlılar", type: "Tescilli Ürün", registration: "25.12.2024 · 1681" },
  { id: "cilbira", name: "Erzurum Cılbıra / Çılbır Yemeği", category: "Yemekler", type: "Tescilli Ürün", registration: "03.08.2023 · 1433" },
  { id: "casir-kavurmasi", name: "Erzurum Çaşır Kavurması", category: "Yemekler", type: "Tescilli Ürün", registration: "06.06.2023 · 1372" },
  { id: "casir-salamurasi", name: "Erzurum Çaşır Salamurası", category: "Tarım Ürünleri", type: "Tescilli Ürün", registration: "08.09.2022 · 1213" },
  { id: "cec-pancari", name: "Erzurum Çeç Pancarı", category: "Tarım Ürünleri", type: "Tescilli Ürün", registration: "26.12.2022 · 1304" },
  { id: "ciris-yemegi", name: "Erzurum Çiriş Yemeği", category: "Yemekler", type: "Tescilli Ürün", registration: "18.08.2022 · 1194" },
  { id: "cortutu-pancari", name: "Erzurum Çortutu Pancarı", category: "Tarım Ürünleri", type: "Tescilli Ürün", registration: "27.12.2021 · 987" },
  { id: "demir-tatlisi", name: "Erzurum Demir Tatlısı", category: "Tatlılar", type: "Tescilli Ürün", registration: "27.12.2021 · 988" },
  { id: "dut-cullamasi", name: "Erzurum Dut Çullaması", category: "Tatlılar", type: "Tescilli Ürün", registration: "23.02.2022 · 1036" },
  { id: "ecem-lavas", name: "Erzurum Ecem / Acem / Lavaş Ekmeği", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "25.05.2023 · 1365" },
  {
    id: "ehram-ihram-dokuma",
    name: "Erzurum Ehram / İhram Dokuma Kumaşı",
    category: "Dokuma ve El Sanatları",
    type: "Tescilli Ürün",
    registration: "06.07.2018 · 364",
    highlight: true,
    story: "Yöresel dokuma hafızasını, el emeğini ve Erzurum'un zarif üretim geleneğini taşıyan kültürel değer.",
  },
  { id: "eksili-dolma", name: "Erzurum Ekşili Dolma", category: "Yemekler", type: "Tescilli Ürün", registration: "27.10.2022 · 1246" },
  { id: "eristesi", name: "Erzurum Eriştesi", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "18.11.2022 · 1258" },
  { id: "et-kavurmasi", name: "Erzurum Et Kavurması", category: "Et Ürünleri", type: "Tescilli Ürün", registration: "05.07.2022 · 1163" },
  { id: "gliko", name: "Erzurum Gliko", category: "Yemekler", type: "Tescilli Ürün", registration: "03.08.2022 · 1187" },
  { id: "herle-corbasi", name: "Erzurum Herle Çorbası", category: "Çorbalar", type: "Tescilli Ürün", registration: "03.08.2023 · 1434" },
  { id: "hink-yemegi", name: "Erzurum Hink Yemeği", category: "Yemekler", type: "Tescilli Ürün", registration: "03.08.2023 · 1435" },
  { id: "hurma-tatlisi", name: "Erzurum Hurma Tatlısı", category: "Tatlılar", type: "Tescilli Ürün", registration: "02.03.2023 · 1340" },
  { id: "kara-fatma-corbasi", name: "Erzurum Kara Fatma Çorbası", category: "Çorbalar", type: "Tescilli Ürün", registration: "08.12.2022 · 1275" },
  { id: "kavut-hasili", name: "Erzurum Kavut Haşılı", category: "Yemekler", type: "Tescilli Ürün", registration: "16.02.2023 · 1338" },
  { id: "kaz-lokmasi", name: "Erzurum Kaz Lokması", category: "Yemekler", type: "Tescilli Ürün", registration: "02.03.2023 · 1343" },
  { id: "kesme-asi-corbasi", name: "Erzurum Kesme Aşı Çorbası", category: "Çorbalar", type: "Tescilli Ürün", registration: "13.04.2022 · 1075" },
  { id: "ketesi", name: "Erzurum Ketesi", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "20.01.2023 · 1318" },
  { id: "kitlama-sekeri", name: "Erzurum Kıtlama Şekeri", category: "Tatlılar", type: "Tescilli Ürün", registration: "25.05.2022 · 1125" },
  { id: "kuru-kayisi-kaysefesi", name: "Erzurum Kuru Kayısı Kaysefesi", category: "Tatlılar", type: "Tescilli Ürün", registration: "01.10.2024 · 1643" },
  { id: "mantisi-hingeli", name: "Erzurum Mantısı / Erzurum Hıngeli", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "11.08.2021 · 847" },
  { id: "paca-corbasi", name: "Erzurum Paça Çorbası", category: "Çorbalar", type: "Tescilli Ürün", registration: "03.04.2026 · 1839" },
  { id: "pastirmasi", name: "Erzurum Pastırması", category: "Et Ürünleri", type: "Tescilli Ürün", registration: "10.01.2023 · 1311" },
  { id: "patates-boranisi", name: "Erzurum Patates Boranisi", category: "Yemekler", type: "Tescilli Ürün", registration: "10.01.2024 · 1641" },
  { id: "pekmezli-baklavasi", name: "Erzurum Pekmezli Baklavası", category: "Tatlılar", type: "Tescilli Ürün", registration: "20.01.2021 · 654" },
  { id: "pekmezli-kadayifi", name: "Erzurum Pekmezli Kadayıfı", category: "Tatlılar", type: "Tescilli Ürün", registration: "19.12.2022 · 1293" },
  { id: "peynir-helvasi", name: "Erzurum Peynir Helvası", category: "Tatlılar", type: "Tescilli Ürün", registration: "16.07.2021 · 806" },
  { id: "su-boregi", name: "Erzurum Su Böreği", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "28.07.2020 · 514" },
  { id: "sucugu", name: "Erzurum Sucuğu", category: "Et Ürünleri", type: "Tescilli Ürün", registration: "25.04.2022 · 1092" },
  { id: "salgam-dolmasi", name: "Erzurum Şalgam Dolması", category: "Yemekler", type: "Tescilli Ürün", registration: "02.08.2022 · 1185" },
  { id: "tatar-boregi", name: "Erzurum Tatar Böreği", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "26.05.2023 · 1367" },
  { id: "tereyagi", name: "Erzurum Tereyağı", category: "Süt Ürünleri", type: "Tescilli Ürün", registration: "23.10.2022 · 1244" },
  { id: "tel-helvasi", name: "Erzurum Tel Helvası", category: "Tatlılar", type: "Tescilli Ürün", registration: "26.09.2022 · 1230" },
  { id: "tuzlu-lokumu", name: "Erzurum Tuzlu Lokumu", category: "Tatlılar", type: "Tescilli Ürün", registration: "26.05.2023 · 1368" },
  { id: "un-helvasi", name: "Erzurum Un Helvası", category: "Tatlılar", type: "Tescilli Ürün", registration: "07.07.2025 · 1751" },
  { id: "yumurta-pilavi", name: "Erzurum Yumurta Pilavı", category: "Yemekler", type: "Tescilli Ürün", registration: "23.02.2022 · 1037" },
  { id: "hasankale-lavasi", name: "Hasankale Lavaşı", category: "Ekmek ve Hamur İşleri", type: "Tescilli Ürün", registration: "04.02.2022 · 1020", district: "Pasinler" },
  { id: "hasita-hasuta", name: "Hasıta / Hasuta", category: "Tatlılar", type: "Tescilli Ürün", registration: "23.05.2022 · 1117" },
  { id: "hinis-koftesi", name: "Hınıs Köftesi", category: "Et Ürünleri", type: "Tescilli Ürün", registration: "04.11.2024 · 1655", district: "Hınıs" },
  {
    id: "hinis-fasulyesi",
    name: "Hınıs Fasulyesi",
    category: "Tarım Ürünleri",
    type: "Tescilli Ürün",
    registration: "27.12.2016 · 206",
    district: "Hınıs",
    highlight: true,
    story: "Erzurum'un tarımsal üretim gücünü temsil eden, bölge toprağı ve iklimiyle kimlik kazanan fasulye değeri.",
  },
  {
    id: "ispir-fasulyesi",
    name: "İspir Fasulyesi",
    category: "Tarım Ürünleri",
    type: "Tescilli Ürün",
    registration: "31.01.2011 · 141",
    district: "İspir",
    highlight: true,
    story: "İspir vadisinin üretim karakterini ve Erzurum'un tarımsal marka gücünü taşıyan seçkin ürün.",
  },
  { id: "ispir-kaymagi", name: "İspir Kaymağı", category: "Süt Ürünleri", type: "Tescilli Ürün", registration: "22.05.2019 · 431", district: "İspir" },
  {
    id: "kadayif-dolmasi",
    name: "Kadayıf Dolması",
    category: "Tatlılar",
    type: "Tescilli Ürün",
    registration: "26.06.2012 · 161",
    highlight: true,
    story: "Erzurum mutfağının en güçlü tatlı imzalarından biri; usta el emeğiyle kent hafızasında yer edinir.",
  },
  { id: "karnavas-bezi", name: "Karnavas Bezi", category: "Dokuma ve El Sanatları", type: "Tescilli Ürün", registration: "20.12.2021 · 976", district: "Olur" },
  { id: "karnavas-dut-pekmezi", name: "Karnavas Dut Pekmezi", category: "Tarım Ürünleri", type: "Tescilli Ürün", registration: "06.09.2009 · 112", district: "Olur" },
  { id: "kuflu-civil-peynir", name: "Küflü Civil Peynir (Göğermiş Peynir)", category: "Süt Ürünleri", type: "Tescilli Ürün", registration: "30.11.2012 · 164" },
  { id: "narman-seker-fasulyesi", name: "Narman Şeker Fasulyesi", category: "Tarım Ürünleri", type: "Tescilli Ürün", registration: "20.07.2020 · 506", district: "Narman" },
  {
    id: "oltu-cag-kebabi",
    name: "Oltu Cağ Kebabı",
    category: "Et Ürünleri",
    type: "Tescilli Ürün",
    registration: "22.02.2010 · 127",
    district: "Oltu",
    highlight: true,
    story: "Erzurum'un ticari ve gastronomik tanınırlığını güçlendiren, ateş ve usta geleneğiyle özdeşleşen değer.",
  },
  {
    id: "oltu-tasi",
    name: "Oltu Taşı",
    category: "Taş ve Maden",
    type: "Tescilli Ürün",
    registration: "27.11.2015 · 192",
    district: "Oltu",
    highlight: true,
    story: "Yer altı zenginliğini ince işçilikle buluşturan, Erzurum'un el sanatı ve ticaret kimliğinde özel yeri olan değer.",
  },
  { id: "pasinler-yaprak-doneri", name: "Pasinler Yaprak Döneri", category: "Et Ürünleri", type: "Tescilli Ürün", registration: "06.09.2023 · 1463", district: "Pasinler" },
  {
    id: "tortum-eksi-pestili",
    name: "Tortum Ekşi Pestili",
    category: "Tarım Ürünleri",
    type: "Tescilli Ürün",
    registration: "29.01.2024 · 1528",
    district: "Tortum",
    highlight: true,
    story: "Tortum'un meyve üretimi ve geleneksel işleme bilgisini taşıyan, bölgesel lezzet mirasının güçlü ürünü.",
  },
];

export const geoCategories: GeoCategory[] = [
  "Süt Ürünleri",
  "Yemekler",
  "Çorbalar",
  "Tatlılar",
  "Tarım Ürünleri",
  "Ekmek ve Hamur İşleri",
  "Et Ürünleri",
  "Dokuma ve El Sanatları",
  "Taş ve Maden",
];
