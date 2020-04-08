const { IResolvers } = require('graphql-tools');
//const { getMedicines,getMedicine } = require('./database.js')

const getOne = (db, id) => db.doc(id).get().then( doc => doc.data() && ({...doc.data(), id}) ).catch( err =>  console.log('Error getting documents:', err));

const getAll = db => db.get().then( query => query.docs.map( doc => ({...doc.data(), id:doc.id}) ) ).catch( err =>  console.log('Error getting documents:', err));

const getMedicByApiId = (medics, apiId) => medics.find(medic => medic.idFromAPI == apiId);

const mapMedicinePrescriptions = (arrayMP, medicines) => arrayMP.map( mp => 
  ({medicine: medicines.find(med => med.id == mp.medicineId), quantity: mp.quantity }));

module.exports = {
  Query: {
    medicine(parent, args, { dataSources }, info) { 
        return getOne(dataSources.dbMedicines, args.id)},

    assignment(parent, args, { dataSources }, info) { 
      return getOne(dataSources.dbAssignments, args.id)},

    medic(parent, args, { dataSources }, info) { 
      return getOne(dataSources.dbMedics, args.id)
    },

    medicines(parent, args, { dataSources }, info) {
      return getAll(dataSources.dbMedicines)},

    assignments(parent, args, { dataSources }, info) {
      return getAll(dataSources.dbAssignments)},

    medics(parent, args, { dataSources }, info) {
      return getAll(dataSources.dbMedics)},
  },

  Medicine: {
    id: ({id}) => id,
    name: ({nombre}) => nombre,
    drugs: ({drugs}) => drugs,
    laboratory: ({laboratorio}) => laboratorio, 
    presentation: ({presentacioncant,presentaciontipo}) => presentacioncant +' '+presentaciontipo,
    code: ({codigo}) => codigo,
    stock: ({cantidad}) => cantidad, 
    loadDate: ({loadDate}) => new Date(loadDate._seconds*1000).toLocaleString()
  },

  Assignment:{
    id: ({id}) => id,
    medic: async ({medicId},args,{dataSources}) => getMedicByApiId(await getAll(dataSources.dbMedics), medicId),
    date: ({date}) => date,
    medicinePrescriptions: async ({medicinePrescriptions},args,{dataSources}) => mapMedicinePrescriptions(medicinePrescriptions,await getAll(dataSources.dbMedicines))
  },

  Medic:{
      id: ({id})=>id,
      idFromApi: ({idFromApi})=> idFromApi,
      name: ({nombre,apellido}) => apellido+', '+nombre,
      license: ({matricula})=> matricula,
      bornDate: ({fechaNacimiento})=>fechaNacimiento,
    }
    
};
  