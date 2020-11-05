const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');

const server = express();

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

const usuarios = [
	{
		id: 1,
		username: "admin",
		email: "",
		password: "admin",
		admin: true
	},
	{
		id: 2,
		username: "leandro",
		email: "leandro@email.com",
		password: "lean123",
		admin: false
	},
	{
		id: 3,
		username: "matias",
		email: "lmatias@email.com",
		password: "mati123",
		admin: false
	},
]

const transferencias = [{
	id: 1,
	from: 1,
	to: 2,
	amount: 250,
	date: "1/1/2020"
},
{
	id: 2,
	from: 2,
	to: 1,
	amount: 500,
	date: "1/1/2020"
}
]

const state = {
	lastTransId: 0,
	lastUserId: 0
}

function initState() {
	state.lastTransId = Math.max(...transferencias.map(transf => transf.id));
	state.lastUserId = Math.max(...usuarios.map(usr => usr.id));
}

function getSaldo(userId){
	const trans = transferencias.filter(t => t.from == userId || t.to == userId);
	
	const saldo = trans.reduce( (acum,tr) => { 
		if(tr.to==userId)
			acum+=tr.amount;
		else	
			acum-=tr.amount;
		
		return acum;
	},0 );

	return saldo;
}


/* Endpoints

POST /usuarios
body: {username,email,password}

GET /usuarios
devuelve [{id,username}]

POST /usuarios/login
body: {username,password}
response: 200 OK {id,username,email}
					400 ERROR

GET /transferencias/idUsario
	Lista transferencias del id logueado
	response: [{id,from,to,amount,date}] donde from o to es idUsuario.

POST /transferencias
	Crea una transferencia
	body: {from,to,amount} //from= el usuario logueado
*/

server.get("/hola", (req, res) => {
	res.send(`Saldo es ${getSaldo(1)}`);
})

/*
GET /usuarios
devuelve [{id,username}]*/

server.get("/usuarios", (req, res) => {
	const users = usuarios.filter(usr => usr.admin == false).map(({ id, username }) => { return { id, username } });
	res.status(200).json(users);
});

/*
POST /usuarios
body: {username,email,password}
*/

server.post("/usuarios", (req, res) => {
	const { username, email, password } = req.body;
	if (!usuarios.find(usr => usr.username == username)) {
		state.lastUserId++;

		const newUser = {
			id: state.lastUserId,
			username,
			email,
			password,
			admin: false
		}

		usuarios.push(newUser);

		res.status('200').send('Usuario creado');

	}
	else
		res.status('404').send(`Usuario ${username} ya existe`);
});

/*
POST /usuarios/login
body: {username,password}
response: 200 OK {id,username,email}
					400 ERROR
*/
server.post("/usuarios/login", (req, res) => {
	const { username, password } = req.body;



	const loginUser = usuarios.find(usr => usr.username == username && usr.password == password);

	if (loginUser) {
		res.status('200').json(
			{
				id: loginUser.id,
				username: loginUser.username,
				email: loginUser.password
			}
		);
	}
	else
		res.status('400').send('Error en usuario y/o contraseña');
});

/*
GET /transferencias/idUsario
Lista transferencias del id logueado
response: [{id,from,to,amount,date}] donde from o to es idUsuario.
*/

server.get('/transferencias/:idUsuario', (req, res) => {
	const id = req.params.idUsuario;	
	const transUsuario = transferencias.filter(t => t.from == id || t.to == id);

	console.log(id,transUsuario);

	res.status(200).send(transUsuario);

});

/*
	POST /transferencias
	Crea una transferencia
	body: {from,to,amount} //from= el usuario logueado
*/

server.post('/transferencias/', (req, res) => {
	const { from, to, amount } = req.body

	if (from || to || amount) {
		res.status(404).send("Debe enviar FROM, TO, amount");
	}else if (getSaldo(from)-amount<0){
		res.status(404).send("Saldo insuficiente");
	}
	else{
		const id = ++state.lastTransId;
		transferencias.push(
			{id: id, from: from, to: to, amount: amount,date: moment().format('DD/MM/YYYY')}
		);
		res.status(200).send("Transferencia enviada");
	}
});



/* INICIAR SERVER */
initState();

server.listen(3000, () => {
	console.log(state);
	console.log('Servidor iniciado...');

});




