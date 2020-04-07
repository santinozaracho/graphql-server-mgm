const { IResolvers } = require('graphql-tools');
//const { getMedicines,getMedicine } = require('./database.js')

const mapToMedicine = doc => ( { id:doc.id, name:doc.data().nombre, drugs:[{name: doc.data().drogas}],
      laboratory: doc.data().laboratorio, presentation: doc.data().presentacioncant +' '+doc.data().presentaciontipo,
      code:doc.data().codigo, stock: doc.data().cantidad, 
      loadDate: new Date(doc.data().loadDate._seconds*1000).toLocaleString()
    });

const mapToAssignment = doc => ( {id: doc.id, medicId: doc.data().medicId,
      date: doc.data().date,medicinePrescriptions: doc.data().medicinePrescriptions
    });

const mapToMedicines = medicinesQuery => { let medicines = []; 
  medicinesQuery.forEach( doc =>  medicines.push( mapToMedicine(doc) ) );
  return medicines 
};

const mapToAssignments = assignmentsQuery => { let assignments = [];
  assignmentsQuery.forEach( doc =>  assignments.push( mapToAssignment(doc) ) );
  return assignments
};

module.exports = {
    Query: {
      medicine(parent, args, context, info) { 
        return context.dbMedicines.doc(args.id).get().then( doc => doc.data() && mapToMedicine(doc) )
        .catch( err =>  console.log('Error getting documents:', err)); },

      medicines(parent, args, context, info) {
        return context.dbMedicines.get().then( query => mapToMedicines(query) )
        .catch( err =>  console.log('Error getting documents:', err)); },

      assignments(parent, args, context, info) {
        return context.dbAssignments.get().then( query => mapToAssignments(query) )
        .catch( err =>  console.log('Error getting documents:', err)); }
  }
};
  