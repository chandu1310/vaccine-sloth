#!/usr/bin/env node
const axios = require('axios');

const playsound = () => {
    const play = require('play');
    play.sound(__dirname+'/node_modules/play/wavs/sfx/intro.wav', () => {});
}

const getAllStores = (zipcode) => {
    const url = `https://www.riteaid.com/services/ext/v2/stores/getStores?address=${zipcode}&attrFilter=PREF-112&fetchMechanismVersion=2&radius=50`;
    return axios.get(url, { Headers: { pragma: "no-cache"}})
    .then(
      ({data}) => {
        return data.Data.stores.map(
          ({storeNumber, address, city, specialServiceKeys}) => ({storeNumber, address, city, jjAvailable: specialServiceKeys.includes('PREF-115') })
        ).filter(m => m.jjAvailable);
      }
    );
}

const checkStoreForSlot = async (store) => {
    const {storeNumber, address, city} = store;
    const url = `https://www.riteaid.com/services/ext/v2/vaccine/checkSlots?storeNumber=${storeNumber}`;
    return axios.get(url)
    .then(
      ({data}) => {
        console.log(`------Checking: ${storeNumber} - ${address}, ${city}`);
        if(data.Data.slots["1"] && !data.Data.slots["2"]){
            // console.log(`FOUND A SLOT AT: ${storeNumber} - ${address}, ${city}`, data.Data.slots);
            return store;
        }else{
            // console.log(`No Slots at ${storeNumber} - ${address}, ${city}`);
            return undefined;
        }
      }
    );
}

const main = async () => {
    const zipcode = process.argv[2] || '97006';
    const stores = await getAllStores(zipcode);
    console.log(`Checking for slots at ${zipcode}`);
    const appointmentInfo = await Promise.all(stores.map(s => checkStoreForSlot(s)));
    let foundAppointment = false;
    appointmentInfo.forEach(a => {
        if(a){
            const {storeNumber, address, city} = a;
            console.log(`Appointments available at : ${storeNumber} - ${address}, ${city}`);
            foundAppointment = true;
        }
    });
    if(foundAppointment)
        playsound();
};

main();
setInterval(main, 30000);
