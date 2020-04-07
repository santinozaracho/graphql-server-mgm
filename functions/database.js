//Imports
const admin = require('firebase-admin');

//Initialize Google Cloud
var serviceAccount = require("./serviceAccount.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: "https://modulogestionmedicamentos.firebaseio.com"});


// Example de usar where y orderby
// var biggest = citiesRef.where('population', '>', 2500000).orderBy('population').limit(2);
//Referencias a las tablas..
let medicamentosRef =  admin.firestore().collection('medicamentos');
let asignacionesRef =  admin.firestore().collection('asignaciones');
let medicosRef = admin.firestore().collection('medicos');
let controlesRef =  admin.firestore().collection('controles');
let cargasRef =  admin.firestore().collection('cargas');

let context = async () => ({ medicinedb: await medicamentosRef });

//Funciones de respuesta
module.exports = { context }


//Funcion de Respuesta de medicamentos
let getMedicines = () => {
	let datos = [];
    medicamentosRef.get()
    .then( (querySnapshot) => {
        querySnapshot.forEach( (doc) => {
            datos.push({
                id: doc.id,
				name: doc.data().nombre,
				drug: {name: doc.data().drogas},
				laboratory: doc.data().laboratorio,
				presentation: doc.data().presentacioncant +' '+doc.data().presentaciontipo,
				stock: doc.data().cantidad,
				loadDate: new Date(doc.data().loadDate._seconds*1000).toLocaleString()
				});
            });
        console.log(datos)
		return datos })
	.catch((err) => {
        console.log('Error getting documents', err)
        return err;
      });
};

let getMedicine = id => { 
	medicamentosRef.doc(id).get()
		.then( (doc) => {	
				if(doc.data()){
					let datos = {};
					datos.id = doc.id
					datos.name = doc.data().nombre
					datos.drug = {name: doc.data().drogas}
					datos.laboratory = doc.data().laboratorio
					datos.presentation = doc.data().presentacioncant +' '+doc.data().presentaciontipo
					datos.stock = doc.data().cantidad
					datos.loadDate = new Date(doc.data().loadDate._seconds*1000).toLocaleString()
					return datos
				}else{
					return {error:'Id Not Found'}
				}
			})
		.catch((err) => {
			console.log('Error getting documents', err);
			return err 
      });
};


var getMedicos =  (req, res, next) => { 
	let datos = [];
	medicosRef.get().then( querySnapshot => {
        querySnapshot.forEach( doc => {
            datos.push({idFirebase: doc.id,id: doc.data().idFromAPI,
				nombre: doc.data().nombre,apellido: doc.data().apellido,
				matricula: doc.data().matricula,fechaNacimiento: doc.data().fechaNacimiento});
            });
		res.status(200).json(datos);})
		.catch((err) => {
			console.log('Error getting documents', err);
			res.status(403).send(err); 
      });
};

var getAsignacion = (req, res, next) => { 
    asignacionesRef.doc(req.params.assignId).get().then( (doc) => {
		if(doc.data()){
			let datos = {};
			datos.id = doc.id;
			datos.medicId= doc.data().medicId;
			datos.date = doc.data().date;
			datos.medicinePrescriptions = doc.data().medicinePrescriptions;
			res.status(200).json(datos);
		}else{
			res.status(400).send({error:'Id not Found'})
		}})
		.catch((err) => {
			console.log('Error getting documents', err);
			res.status(403).send(err); 
      });
};
//Funcion que devuelve las Partidas
var getAsignaciones = (req, res, next) => {  
	let datos = [];
    asignacionesRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            datos.push(
						{id:doc.id,
						medicId:doc.data().medicId,
						date:doc.data().date,
						medicinePrescriptions:doc.data().medicinePrescriptions}
					);
			
            });
		res.json(datos);  
		}).catch((err) => {
			console.log('Error getting documents', err);
			res.send(err); 
      });
};

//Funcion de Respuesta que controla las partidas entrantes o Asignaciones
var setAsignation = async (req, res, next) => {
	let {medicId,date,medicinePrescriptions} =req.body
	var newAssign = {};
	newAssign.medicId = medicId;
	newAssign.date = date
	newAssign.medicinePrescriptions = medicinePrescriptions;
	//Validating Info..
	if ( newAssign.medicId && newAssign.medicinePrescriptions.length > 0 ) {
		//Descontando Stock y luego...
		await stockListDisscount(newAssign.medicinePrescriptions)
		.then( async (resp) => {
			//Creamos la Partida y Enviamos la refId
			console.log(resp);
			console.log("Stock descontado totalmente inciando creacion..");
			
			await createAssign(newAssign)
			.then( (respOk) => {res.status(201).send({id:respOk})} )
			.catch( (error) => {res.status(400).send("Error:"+error)} );})
		.catch( (error) => {
			console.log("Aca:"+error);
			res.status(403).send("Error:"+error)} );
	}else{
		res.status(403).send("Error: Validacion de Datos. Falta Medic ID o Lista Vacia");
	}
};
//Funcion que Almacena en la BD un nuevo medicamento
let createMedicamento = (req, res) => {
	let newMed = req.body
	//Validamos datos.
	if (newMed.cantidad >= 0) {
		//Pegamos la Hora de creacion
		newMed.loadDate = FieldValue.serverTimestamp();
		newMed.cantidad=parseInt(newMed.cantidad);
		delete newMed.validated;
		//Añadimos
		medicamentosRef.add(newMed)
		.then( (doc) => {
			res.status(200).send(doc.id)
			console.log("Success!!!"+ doc.id);})
		.catch((err) => {
			res.status(401).send(err)
			console.log('Error getting documents', err);});
	}
	
	};
//Selector de Puts de Medicinas para realizar controles o actualizaciones
let putLoadMedicamento = (req,res,next)=>{
			console.log("Se ejecuta un Carga");
			loadMedic(req.body,req.params.medicineId)
			.then( (resp) => {res.status(200).send(resp.ok)} )
			.catch( (error) => {res.status(401).send(error.error)} );
};

let putControlMedicamento = (req,res,next)=>{
			console.log("Se ejecuta un Control");
			controlMedic(req.body,req.params.medicineId)
			.then( (resp) => {res.status(200).send(resp.ok)} )
			.catch( (error) => {res.status(401).send(error.error)} );
	};
//Funcion para la eliminacion de los medicamentos
let delMedicamento = (req,res,next)=>{
		medicamentosRef.doc(req.params.medicineId)
		.delete()
		.then((refId) => {
			res.status(200).send("Deleted!")
			console.log("Success!!! Delete!!");})
		.catch((err) => {
			res.status(401).send(err)
			console.log('Error getting documents', err);});
};
//Funcion para la eliminacion de los medicamentos
let delAsignaciones = (req,res,next)=>{
		asignacionesRef.doc(req.params.assignId)
		.delete()
		.then((refId) => {
			res.status(200).send("Deleted!")
			console.log("Success!!! Delete!!");})
		.catch((err) => {
			res.status(401).send(err)
			console.log('Error getting documents', err);});
};


//Funciones de SOPORTE  a las Anteriores
//Funcion que pre el formato de entrada de partidas.
let preValidaPartidas = (array) => {
		const status = true;
		array.forEach( item => {
			if (!item.medicineId && item.quantity < 1) {
				return false
			}});
		return status	
	};
//Funcion que Verifica el Stock y Descuenta en la BD
let stockDisscount = async item =>{
	let medicItemRef = medicamentosRef.doc(item.medicineId);	
	return await medicItemRef.get()
		.then(async doc => {	
			if ( doc.exists && doc.data().cantidad >= parseInt(item.quantity) )  {
				//Preparando el Decremento de Stock
				const decreaseBy = FieldValue.increment(-parseInt(item.quantity));
				//Busqueda y Actaulizacion
				await medicItemRef
				.update({"cantidad":decreaseBy,"updatedDate":FieldValue.serverTimestamp()})
				.then( (doc) => {
					console.log("Item disscounted!!"+doc.id);
					return Promise.resolve("Ok!")})
				.catch( (error) => {
					console.log("Error updating document: ", error);
					return Promise.reject(error) });		
			}else{ 
				console.log("Se da Cuenta del error");
				return Promise.reject("No se encontro el doc con medicineId o supera el Stock.");
			}})
		.catch( error => {
			console.log('Error getting document', error);
			return Promise.reject(error)
			});	
};
//Funcion que se encarga de llamar a la anterior con cada Item de la Partida
let stockListDisscount = async (array) => {
	return new Promise((resolve,reject) => {
		let validate = preValidaPartidas(array);
		console.log("Fue pre validado?: "+validate);
		if (validate) {
			//Recorremos el array de partidas
			// eslint-disable-next-line array-callback-return
			array.map(item => {
				//Descontamos Item..
				stockDisscount(item)
				.then(status => {resolve(status)})
				.catch( error => {console.log(error);
				 reject(error) } )
			})
		}else{
			reject("No paso la Pre-Validacion")
		}
	})
};
//Funcion que se encarga de crear la Asignacion o partida en la BD, Responde con el ID
let createAssign = (newAssign) => {
	return new Promise((resolve,reject) => {
		//Pegamos la Hora de creacion
		newAssign.partDate = FieldValue.serverTimestamp();
		// Realizamos la consulta a  la BD
		asignacionesRef
		.add(newAssign)
		.then( (refId) => {
			setTimeout(() => {
				resolve(refId.id)
			}, 100);	
			console.log("Success!!!"+ refId.id);})
		.catch((error) => {
			reject(error);
			console.log('Error getting documents', error);});
		})
	};

//Si se desea realizar una Carga o Actualizacion de Stock
let loadMedic = (newLoadMedic,refId) => {
	return new Promise((resolve,reject) => {
		if ( newLoadMedic.cantidad > 0 ) {
			//Registramos Movimiento
			newLoadMedic.loadDate = FieldValue.serverTimestamp();
			//Cargamos la Variable de incremento
			const loadBy = FieldValue.increment(parseInt(newLoadMedic.cantidad));
			//Realizamos consulta
			medicamentosRef.doc(refId)
			.update({"cantidad":loadBy,"loadDate":newLoadMedic.loadDate})
			.then( (refId) => {
				console.log("Success!!!");
				resolve({ok:"Se Realizo correctamente la Carga."})})
			.catch((err) => {
				console.log('Error getting documents', err);
				reject({error:err})});
		}else{
			reject({error:"Cantidad no permitida."})
			}
		})
	};
//Si se desea realizar un Control o Modificacion del stock!
let controlMedic = (newControlMedic,refId)=>{
	return new Promise((resolve,reject) => {
		if (newControlMedic.cantidad > 0) {

			newControlMedic.controlDate = FieldValue.serverTimestamp();
			medicamentosRef.doc(refId)
			.update({"cantidad":parseInt(newControlMedic.cantidad),"controlDate":newControlMedic.controlDate})
			.then( (refId) => {
				console.log("Success!!!");
				resolve({ok:"Se Realizo correctamente el Control."})})
			.catch((err) => {
				console.log('Error getting documents', err);
				reject({error:err})});
			}else{
				reject({error:"Cantidad no permitida."})
				}
		})	
	};

let test = function (req, res, next) {
  res.json({test:"Testeando Rutas"});
  next()
};

