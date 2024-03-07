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


router.post('/uploads', (req, res) => { });

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
    const { id_ciudadano } = req.body
    mysqlConeccion.query('select *, DATE_FORMAT(fecha_hora_alta, "%d-%m-%Y %H:%i  ") AS fecha_hora_formateada FROM productos p WHERE p.id_ciudadano=?', [id_ciudadano], (err, registro) => {
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
    const { id_ciudadano } = req.body
    mysqlConeccion.query('SELECT  p.id_producto, MAX(p.nombre) AS nombre, DATE_FORMAT(MAX(fecha_hora_alta), "%d-%m-%Y %H:%i") AS fecha_hora_formateada, MAX(pi.nombre) AS imagen FROM  productos p LEFT JOIN  productos_imagenes pi ON p.id_producto = pi.id_producto WHERE p.estado != "I" AND p.id_ciudadano != ? GROUP BY p.id_producto', [id_ciudadano], (err, registro) => {
        if (!err) {
            res.json({
                status: true,
                datos: registro
            });
        } else {
            res.json({
                status: false,
                mensaje: 'Sin Datos',
                error: err
            });
        }
    })
});
/////////////detalle de un producto los/////////////////////
router.post('/detalleproducto', (req, res) => {
    const { id_producto } = req.body
    mysqlConeccion.query('select pi.nombre AS nombre, p.nombre nombre_producto, p.id_ciudadano  FROM productos_imagenes pi INNER JOIN productos p ON p.id_producto=pi.id_producto WHERE pi.id_producto=?', [id_producto], (err, registro) => {
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

    const { id_categoria, descripcion, nombre, id_ciudadano } = req.body
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
                mensaje: "El producto se guardo correctamente"
            });
        } else {
            res.json({
                status: false,
                mensaje: "El producto no se guardo correctamente"
            });
        }
    });
});
/////////////////ofertar//////////////////
router.post('/ofertar', (req, res) => {

    const { id_producto, id_ofertante, id_ofertado, productos_ofertados } = req.body
    let query = `INSERT INTO intercambio(id_producto, id_usuario_interesado, id_ofertado, fecha_hora, estado_intercambio) VALUES ('${id_producto}','${id_ofertante}','${id_ofertado}', NOW() ,'Nuevo')`;
    console.log(query)

    mysqlConeccion.query(query, (err, results, fields) => {
        const idInsertado = results.insertId;
        
        if (!err) {
            productos_ofertados.forEach((productos, index) => {
                mysqlConeccion.query('INSERT INTO  intercambio_detalle (id_intercambio, id_producto) VALUE(?,?) ',
                    [idInsertado, productos], (error, registros) => {
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
                mensaje: "Se oferto por el producto Correctamente, En breve seguro te respondera! Gracias"
            });
        }else{
            res.json({
                status: false,
                error: err
            });
        }
    });
});

/////////////////ofertas recividas//////////////////
router.post('/misofertas', (req, res) => {

    const { id_ofertado } = req.body
    mysqlConeccion.query('select p.nombre AS nombre_persona, pr.nombre nombre_producto, i.id_producto, id_intercambio FROM intercambio i INNER JOIN productos pr ON pr.id_producto=i.id_producto INNER JOIN ciudadanos p ON p.id_ciudadano=pr.id_usuario_interesado WHERE i.id_ofertado=?', [id_ofertado], (err, registro) => {
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

/////////////////ofertas realizads//////////////////
router.post('/ofertasrealizadas', (req, res) => {

    const { id_ciudadano } = req.body
    mysqlConeccion.query('select p.nombre AS nombre_persona, pr.nombre nombre_producto, i.id_producto, id_intercambio FROM intercambio i INNER JOIN productos pr ON pr.id_producto=i.id_producto INNER JOIN ciudadanos p ON p.id_ciudadano=i.id_ofertado WHERE i.id_usuario_interesado=?', [id_ciudadano], (err, registro) => {
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
/////////////////ofertaron//////////////////
router.post('/ofrecieron', (req, res) => {
    const { id_ofertado } = req.body
    mysqlConeccion.query('select p.nombre AS nombre_persona, pr.nombre nombre_producto, i.id_producto, id_intercambio FROM intercambio i INNER JOIN productos pr ON pr.id_producto=i.id_producto INNER JOIN ciudadanos p ON p.id_ciudadano=i.id_usuario_interesado WHERE estado_intercambio="Nuevo" AND i.id_ofertado=?', [id_ofertado], async (err, registros) => {
        if (!err) {
            try {
                if(registros.length>0){
                    for (let i = 0; i < registros.length; i++) {
                    const registro = registros[i];
                    const detalle = await obtenerDetalle(registro.id_intercambio);
                    if (detalle.length > 0) {
                        registro['detalle'] = detalle;
                    }
                }
                
                res.json({
                    status: true,
                    datos: registros
                });
                }else{
                    res.json({
                        status: false,
                        mensaje: 'Sin Datos'
                    });
                }
            } catch (error) {
               
                res.json({
                    status: false,
                    mensaje: 'Error al obtener detalles'
                });
            }
        } else {
            
            res.json({
                status: false,
                mensaje: 'Sin Datos'
            });
        }
    })
});
async function obtenerDetalle(id_intercambio) {
    return new Promise((resolve, reject) => {
        mysqlConeccion.query('SELECT i.id_producto, p.nombre FROM intercambio_detalle i INNER JOIN productos p ON p.id_producto=i.id_producto  WHERE i.id_intercambio=?', [id_intercambio], async (error, productos) => {
            if (error) {
                reject(error);
            } else {
                for (let i = 0; i < productos.length; i++) {
                    const producto = productos[i];
                    const detallesImagenes = await obtenerDetalleImagenes(producto.id_producto);
                    if (detallesImagenes.length > 0) {
                        producto['imagenes'] = detallesImagenes;
                    }
                }
                resolve(productos);
            }
        });
    });
}
async function obtenerDetalleImagenes(id_producto) {
    return new Promise((resolve, reject) => {
        mysqlConeccion.query('SELECT pi.nombre FROM productos_imagenes pi  WHERE pi.id_producto=?', [id_producto], (error, imagenes) => {
            if (error) {
                reject(error);
            } else {
                resolve(imagenes);
            }
        });
    });
}
router.get('/detalleintercambio/:id_intercambio', (req, res) => {

    const { id_intercambio } = req.params
    mysqlConeccion.query('select  i.id_producto FROM intercambio_detalle i  WHERE i.id_intercambio=?', [id_intercambio], (err, registro) => {
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
////////////////////////////////////////////////////////
router.post('/aceptarIntercambio', (req, res) => {
    const { id_intercambio } = req.body
    // let hash = bcrypt.hashSync(pass,10);
    console.log(req.body)
    let query = `UPDATE intercambio SET  estado_intercambio='Aceptado', fecha_hora_actualizacion=NOW() WHERE id_intercambio='${id_intercambio}'`;
    mysqlConeccion.query(query, (err, registros) => {
        if (!err) {

            mysqlConeccion.query('UPDATE productos p INNER JOIN intercambio i ON p.id_producto = i.id_producto SET p.estado = "I" WHERE i.id_intercambio=?', [id_intercambio], async (error, productos) => {
                if (!error) {
                    mysqlConeccion.query('UPDATE productos p INNER JOIN intercambio_detalle i ON p.id_producto = i.id_producto SET p.estado = "I" WHERE i.id_intercambio=?', [id_intercambio], async (error, productos) => {
                        if (!error) {
                            res.json({
                                status: true
                            });
                        }
                    })
                }})
        } else {
            console.log(err)
        }
    })
});

///////////////////////////////////////////////////////
router.post('/denegoIntercambio', (req, res) => {
    const { id_intercambio } = req.body
    // let hash = bcrypt.hashSync(pass,10);
    console.log(req.body)
    let query = `UPDATE intercambio SET estado_intercambio='Denegado', fecha_hora_actualizacion=NOW() WHERE id_intercambio='${id_intercambio}'`;
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
router.post('/misintercambios', (req, res) => {
    const { id_ciudadano } = req.body
    mysqlConeccion.query('SELECT DATE_FORMAT(fecha_hora, "%d-%m-%Y %H:%i  ") AS fecha_hora_formateada, p.nombre, concat_ws(" ", c.apellido, c.nombre) interesado, c.telefono, c.correo  from intercambio i inner join ciudadanos c on c.id_ciudadano=i.id_usuario_interesado INNER join productos p on p.id_producto=i.id_producto WHERE i.id_ofertado=?', [id_ciudadano], (err, registro) => {
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
module.exports = router;