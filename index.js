const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const cities = require('./City.json');
const slug = require('./slug');
const sorted = require('./sorted');

async function getPharmacies(URL, city) {
  console.log(city)
  const { data } = await axios.get(URL);
  const $ = cheerio.load(data);
  let pharmacies = [];
  let addreses = [];
  let phones = [];
  let locations = [];
  $("article #resultats_h3_span").each(function (i, elem) {
    const pharmacy = {};
    pharmacy.name = $(elem).text().trim();
    pharmacies.push(pharmacy);
  });
  $("article .results-adress").each(function (i, elem) {
    const pharmacy = {};
    pharmacy.address = $(elem).text().trim();
    addreses.push(pharmacy);
  });
  $("article .tel").each(function (i, elem) {
    const pharmacy = {};
    pharmacy.phone = $(elem).text().trim();
    phones.push(pharmacy);
  });
  let results = [];
  $("article a").each(function (i, elem) {
      results.push($(elem).attr('href'));
    });
    locations = results.filter(el => el.match(/plan-acce/g));
    for(let i = 0; i < locations.length; i++) {
      locations[i] = {
        location: `https://www.telecontact.ma${locations[i]}`
      }
    }
  for (let i = 0; i < pharmacies.length; i++) {
    pharmacies[i] = {
      name: pharmacies[i].name.replace('   ', ''),
      ...addreses[i],
      ...phones[i],
      location: locations[i] === undefined ? "" : slug(pharmacies[i].name) === slug(locations[i].location.split('/')[4]) ? locations[i].location : "",
      city,
    };
  }
  return pharmacies;
}
//const URL = 'https://www.telecontact.ma/trouver/index.php?nxo=moteur&nxs=process&string=Pharmacies&ou=Beni+Mellal&aproximite=&produit=';

//getPharmacies(URL, 'Beni Mellal')

function removeDuplicateObjectFromArray(arr, keyProps) {
  return Object.values(
    arr.reduce((uniqueMap, entry) => {
      const key = keyProps.map((k) => entry[k]).join("|");
      if (!(key in uniqueMap)) uniqueMap[key] = entry;
      return uniqueMap;
    }, {})
  );
}

async function getPharmaciesByCity() {
  let cities = JSON.parse(fs.readFileSync('./City.json')); 
  cities = sorted(cities);
  for(let item of cities){
    let all = [];
    for(let i = 1; i <= item.lastPage; i++) {
      let URL = `https://www.telecontact.ma/trouver/index.php?nxo=moteur&nxs=process&string=Pharmacies&ou=${item.name}&ou_ville=&trouver=&page=${i}&quartier=&rubrique_name=&rubrique_affiner=609240;609250&region=&m_ru_n=&activ=&produit=`;
        const result = await getPharmacies(URL, item.name);
        all.push(...result);
        console.log(item.name)
    }
      all = removeDuplicateObjectFromArray(all, ['name'])
     let data = JSON.stringify(all);
     fs.writeFileSync(`./resources/${item.name}.json`, data);
  }
}

getPharmaciesByCity();
