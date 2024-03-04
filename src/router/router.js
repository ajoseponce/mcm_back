const express = require('express');
const router = express();
// libreria que utilizaremos para la encriptacion de los password
const bodyParser = require('body-parser');
const multer = require('multer');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: true
}));
// Configura multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'src/uploads/'); // La carpeta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo guardado
    }
  });
  
  const upload = multer({ storage: storage });
// // libreria que utilizaremos para la generacion de nuesrto token/
const jwt = require('jsonwebtoken');
//////archivo de coneccion
const mysqlConeccion = require('../bd/bd');
///////////multer



/////////fs y xla
const fs = require('fs');
// const xlsx = require('xlsx');
///////ruta raiz
router.get('/test', (req, res) => {
    res.send('hola esta funcionando');
});
router.post('/buscar', (req, res) => {
    const { dni, sexo } = req.body
    console.log(req.body);
});


router.post('/uploads', (req, res) => {});

router.post('/importador', upload.single('file'), (req, res) => {
    console.log(req.file, req.body)
    const workbook = xlsx.readFile('./src/uploads/' + req.file.filename); // Reemplaza 'archivo.xlsx' con el nombre de tu archivo
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir la hoja a un objeto JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Recorrer los datos
    jsonData.forEach((row, index) => {
        // Aquí puedes realizar operaciones con los datos de cada fila
        console.log("en la teoriaentro" + row.dni)
        mysqlConeccion.query('select u.id from personas u where 1 AND dni=?', [row.dni], (err, rows) => {
            if (!err) {
                if (rows.length != 0) {
                    mysqlConeccion.query('select u.id_beca from becas u where 1 AND id_persona=? AND id_tipo_beca=? AND periodo=? AND anio=?', [rows[0].id, req.body.tipo_beca, req.body.periodo, req.body.anio], (err, existe) => {
                        if (!err) {
                            if (existe.length == 0) {
                                let query = `INSERT INTO becas (id_persona,id_tipo_beca, periodo, anio, fecha_alta, monto, estado) VALUES ('${rows[0].id}','${req.body.tipo_beca}','${req.body.periodo}','${req.body.anio}',NOW(),'${row.monto}', 'A')`;
                                mysqlConeccion.query(query, (err, registros) => {
                                    if (!err) {

                                        console.log("en la teoria grabo ya la persona existente" + rows[0].id)


                                    }
                                })
                            }

                        }
                    })
                } else {
                    if (row.persona != undefined) {
                        var arrayDeCadenas = row.persona.split(" ");

                        let nombre = `${arrayDeCadenas[1]} ${arrayDeCadenas[2]} ${arrayDeCadenas[3]}`
                        nombre = nombre.replace('undefined', '')

                        let query = `INSERT INTO personas (apellido,nombre, dni) VALUES ('${arrayDeCadenas[0]}','${nombre}','${row.dni}')`;
                        console.log(query)
                        mysqlConeccion.query(query, (err, registro) => {
                            if (!err) {
                                console.log("el id de la persona" + registro.insertId)
                                let query = `INSERT INTO becas (id_persona,id_tipo_beca, periodo, anio, fecha_alta, monto, estado) VALUES ('${registro.insertId}','${req.body.tipo_beca}','${req.body.periodo}','${req.body.anio}',NOW(),'${row.monto}', 'A')`;
                                mysqlConeccion.query(query, (err, beca) => {
                                    if (!err) {

                                        console.log("en la teoria grabo la persona nueva y despues todo" + beca.insertId)

                                    }
                                })
                            }
                        })
                        // console.log(`Fila ${index + 1}:`,`hay q insertar `, row.persona);
                    }

                }
            } else {
                res.json(
                    {
                        status: false,
                        mensaje: "Error en el servidor"
                    });

            }
        });
    });
});

router.post('/login', (req, res) => {

    const { usuario, password } = req.body

    if (usuario != undefined && password != undefined) {
        mysqlConeccion.query('select u.id_ciudadano, CONCAT_WS(" ",u.apellido, u.nombre) nombre_persona,  u.password from ciudadanos u where 1 AND correo=?', [usuario], (err, rows) => {
            if (!err) {
                if (rows.length != 0) {
                    if (password == rows[0].password) {
                        jwt.sign({ rows }, 'mcmmds', (token) => {
                            res.json(
                                {
                                    status: true,
                                    datos: rows,
                                    token: token
                                });
                        })
                    } else {
                        res.json(
                            {
                                status: false,
                                mensaje: "La Contraseña es incorrecta"
                            });
                    }
                } else {
                    res.json(
                        {
                            status: false,
                            mensaje: "El usuario no existe "
                        });

                }
            } else {
                res.json(
                    {
                        status: false,
                        mensaje: "Error en el servidor"
                    });

            }
        });
    } else {
        res.json({
            status: false,
            mensaje: "Faltan completar datos"
        });
    }
});
/////////////candidatos

/////////////////////////
///////////espacios comunitarios//////////////
/////////////////////////

///////////////////////baja beca
router.post('/cambiopass', (req, res) => {
    const { id_usuario, pass } = req.body
    // let hash = bcrypt.hashSync(pass,10);
    console.log(req.body)
    let query = `UPDATE usuarios SET  password='${hash}' WHERE id_usuario='${id_usuario}'`;
    mysqlConeccion.query(query, (err, registros) => {
        if (!err) {
            res.json({
                status: true
            });

        } else {
            console.log(err)
        }
    })
});
//////////////////////////////////////
////////////////usuarios//////////////
/////////////////////////////////////
router.post('/usuarios', async (req, res) => {
    const { usuario, telefono, apellido_nombre, rol, id_agrupacion, id_candidato, password } = req.body
    // let hash = bcrypt.hashSync(password,10);

    // aca  consulto si existe ya ese nombre en la bd
    let query = `INSERT INTO usuarios (usuario, password, telefono, apellido_nombre, rol, id_agrupacion, id_candidato, estado) VALUES ('${usuario}','${hash}','${telefono}','${apellido_nombre.toUpperCase()}','${rol}','${id_agrupacion}','${id_candidato}','A')`;
    // let query=`INSERT INTO usuarios (usuario, password, telefono, apellido_nombre, estado) VALUES ('${usuario}','${hash}','${telefono}','${apellido_nombre}','A')`;
    console.log(query)
    mysqlConeccion.query(query, (err, registros) => {
        if (!err) {
            res.json({
                status: true,
                mensaje: "El usuario se creo correctamente"
            });
        } else {
            res.json({
                status: false,
                mensaje: "Hubo un error en el servidor.La accion no se realizo"
            });
            // res.send('Ocurrio un error desde el servidor'+err);
        }
    })
});
////////
router.get('/usuarios', (req, res) => {
    mysqlConeccion.query('select u.*, c.nombre candidato, a.nombre agrupacion FROM usuarios u LEFT JOIN agrupaciones a ON a.id=u.id_agrupacion left join candidatos c on c.id=u.id_candidato', (err, registro) => {
        if (!err) {
            res.json(registro);
        } else {
            console.log(err)
        }
    })
});

router.post('/registro', async (req, res) => {
    const { telefono, apellido, nombre, correo, password } = req.body
    // let hash = bcrypt.hashSync(password,10);

    // aca  consulto si existe ya ese nombre en la bd
    let query = `INSERT INTO ciudadanos (apellido, nombre, correo, password, telefono, fecha_alta, estado) VALUES ('${apellido}','${nombre}','${correo}','${password}','${telefono}',NOW(),'A')`;
    console.log(query)
    mysqlConeccion.query(query, (err, registros) => {
        if (!err) {
            res.json({
                status: true,
                mensaje: "El ciudadano se creo correctamente"
            });
        } else {
            res.json({
                status: false,
                mensaje: "Hubo un error en el servidor.La accion no se realizo"
            });
            
        }
    })
});
//////////////////////////////////
router.post('/misproductos', (req, res) => {
    const { id_ciudadano }=req.body
    mysqlConeccion.query('select *, DATE_FORMAT(fecha_hora_alta, "%d-%m-%Y %H:%i  ") AS fecha_hora_formateada FROM productos p WHERE p.id_ciudadano=?',[id_ciudadano], (err, registro) => {
        if (!err) {
            res.json({
                status: true,
                datos: registro
            });
        } else {
            res.json({
                status: false,
                mensaje: 'Sin Datos'
            });
        }
    })
});
/////////////todos los/////////////////////
router.post('/allproductos', (req, res) => {
    const { id_ciudadano }=req.body
    mysqlConeccion.query('select *, DATE_FORMAT(fecha_hora_alta, "%d-%m-%Y %H:%i  ") AS fecha_hora_formateada, MAX(pi.nombre) AS imagen FROM productos p LEFT JOIN productos_imagenes pi ON p.id_producto = pi.id_producto WHERE p.id_ciudadano!=?',[id_ciudadano], (err, registro) => {
        if (!err) {
            res.json({
                status: true,
                datos: registro
            });
        } else {
            res.json({
                status: false,
                mensaje: 'Sin Datos'
            });
        }
    })
});
//////////////////////////////////
router.post('/upload', upload.array('imagenes', 3), (req, res) => {

   const {id_categoria, descripcion, nombre, id_ciudadano }=req.body
   let query = `INSERT INTO productos(id_categoria, nombre, descripcion, estado, fecha_hora_alta,id_ciudadano) VALUES ('${id_categoria}','${nombre}','${descripcion}','A', NOW() ,'${id_ciudadano}')`;
   mysqlConeccion.query(query, (err, results, fields) => {
       const idInsertado = results.insertId;
       if (!err) {
            req.files.forEach((row, index) => {
                mysqlConeccion.query('INSERT INTO productos_imagenes (id_producto, nombre, estado) VALUE(?,?,"A") ', 
                [idInsertado, row.filename], (error, registros) => {
                    if (error) {
                        res.json({
                            status: false,
                            mensaje: "Hubo un error"
                        });
                        return;
                    }
                });
            })
            res.json({
                status: true,
                mensaje: "El procucto se guardo correctamente"
            });
        }else{
            res.json({
                status: false,
                mensaje: "El procucto no se guardo correctamente"
            }); 
        }
    });
});
   
module.exports = router;