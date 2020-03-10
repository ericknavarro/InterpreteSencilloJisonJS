var fs = require('fs'); 
var parser = require('./gramatica');

// Constantes para operaciones, instrucciones y valores
const TIPO_INSTRUCCION = require('./instrucciones').TIPO_INSTRUCCION;
const TIPO_OPERACION = require('./instrucciones').TIPO_OPERACION;
const TIPO_VALOR = require('./instrucciones').TIPO_VALOR;
const instruccionesAPI = require('./instrucciones').instruccionesAPI;
const TIPO_OPCION_SWITCH = require('./instrucciones').TIPO_OPCION_SWITCH;

// Tabla de Simbolos
const TIPO_DATO = require('./tabla_simbolos').TIPO_DATO;
const TS = require('./tabla_simbolos').TS;

let ast;
try {
    // leemos nuestro archivo de entrada
    const entrada = fs.readFileSync('./entrada.txt');
    // invocamos a nuestro parser con el contendio del archivo de entradas
    ast = parser.parse(entrada.toString());

    // imrimimos en un archivo el contendio del AST en formato JSON
    fs.writeFileSync('./ast.json', JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
    return;
}

// Creación de una tabla de simbolos GLOBAL para iniciar con el interprete
const tsGlobal = new TS([]);

// Procesamos las instrucciones reconocidas en nuestro AST
procesarBloque(ast, tsGlobal);


/**
 * Este es el método principal. Se encarga de recorrer las instrucciones en un bloque,
 * identificarlas y procesarlas
 * @param {*} instrucciones 
 * @param {*} tablaDeSimbolos 
 */
function procesarBloque(instrucciones, tablaDeSimbolos) {
    instrucciones.forEach(instruccion => {
   
        if (instruccion.tipo === TIPO_INSTRUCCION.IMPRIMIR) {
            // Procesando Instrucción Imprimir
            procesarImprimir(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.MIENTRAS) {
            // Procesando Instrucción Mientras
            procesarMientras(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo == TIPO_INSTRUCCION.PARA) {
            // Procesando Instrucción Para
            procesarPara(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.DECLARACION) {
            // Procesando Instrucción Declaración
            procesarDeclaracion(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.ASIGNACION) {
            // Procesando Instrucción Asignación
            procesarAsignacion(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.IF) {
            // Procesando Instrucción If
            procesarIf(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.IF_ELSE) {
            // Procesando Instrucción If Else
            procesarIfElse(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.SWITCH) {
            // Procesando Instrucción Switch  
            procesarSwitch(instruccion, tablaDeSimbolos);
        } else if (instruccion.tipo === TIPO_INSTRUCCION.ASIGNACION_SIMPLIFICADA) {
            // Procesando Instrucción Asignacion Simplificada
            procesarAsignacionSimplificada(instruccion, tablaDeSimbolos);
        }  else {
            throw 'ERROR: tipo de instrucción no válido: ' + instruccion;
        }
    });
}


/**
 * De acuerdo con nuestra gramática, aqui, expresión puede ser una operación aritmética binaria (SUMA, RESTA, MULTIPLICACION, DIVISION),
 * una operación aritmética unaria (NEGATIVO) o un valor correspondiente a un NUMERO o a un IDENTIFICADOR
 * @param {*} expresion 
 * @param {TS} tablaDeSimbolos
 * Evaluamos cada caso para resolver a un valor tipo número de acuerdo al tipo de operación.
 */
function procesarExpresionNumerica(expresion, tablaDeSimbolos) {
    if (expresion.tipo === TIPO_OPERACION.NEGATIVO) {
        // Es un valor negado.
        // En este caso necesitamos procesar el valor del operando para poder negar su valor.
        // Para esto invocamos (recursivamente) esta función para sesolver el valor del operando.
        const valor = procesarExpresionNumerica(expresion.operandoIzq, tablaDeSimbolos).valor;     // resolvemos el operando
        
        // Retornamos el valor negado.
        const res= valor * -1;
        return {valor: res, tipo: TIPO_DATO.NUMERO};
    } else if (expresion.tipo === TIPO_OPERACION.SUMA 
        || expresion.tipo === TIPO_OPERACION.RESTA
        || expresion.tipo === TIPO_OPERACION.MULTIPLICACION
        || expresion.tipo === TIPO_OPERACION.DIVISION) {
        // Es una operación aritmética.
        // En este caso necesitamos procesar los operandos antes de realizar la operación.
        // Para esto incovacmos (recursivamente) esta función para resolver los valores de los operandos.
        let valorIzq = procesarExpresionNumerica(expresion.operandoIzq, tablaDeSimbolos);      // resolvemos el operando izquierdo.
        let valorDer = procesarExpresionNumerica(expresion.operandoDer, tablaDeSimbolos);      // resolvemos el operando derecho.
        if(valorIzq.tipo!==TIPO_DATO.NUMERO || valorDer.tipo!==TIPO_DATO.NUMERO){
            throw 'ERROR: se esperaban expresiones numericas para ejecutar la: ' + expresion.tipo;
        }else{
            valorIzq=valorIzq.valor;
            valorDer=valorDer.valor;
        }
        if (expresion.tipo === TIPO_OPERACION.SUMA){
            const res= valorIzq + valorDer;
            return {valor: res, tipo: TIPO_DATO.NUMERO };
        }
        if (expresion.tipo === TIPO_OPERACION.RESTA) {
            const res= valorIzq - valorDer;
            return {valor: res, tipo: TIPO_DATO.NUMERO };
        }
        if (expresion.tipo === TIPO_OPERACION.MULTIPLICACION) {
            const res= valorIzq * valorDer;
            return {valor: res, tipo: TIPO_DATO.NUMERO };
        }
        if (expresion.tipo === TIPO_OPERACION.DIVISION) {
            if(valorDer === 0){
                throw 'ERROR: la division entre 0 da como resultado: '+valorIzq/valorDer;
            }else{
                const res= valorIzq / valorDer;
                return {valor: res, tipo: TIPO_DATO.NUMERO };
            }
        };

    } else if (expresion.tipo === TIPO_VALOR.NUMERO) {
        // Es un valor numérico.
        // En este caso únicamente retornamos el valor obtenido por el parser directamente.
        return {valor: expresion.valor, tipo: TIPO_DATO.NUMERO };
    } else if (expresion.tipo === TIPO_VALOR.IDENTIFICADOR) {
        // Es un identificador.
        // Obtenemos el valor de la tabla de simbolos
        const sym = tablaDeSimbolos.obtener(expresion.valor);
        return {valor: sym.valor, tipo: sym.tipo};
    } else {
        throw 'ERROR: expresión numérica no válida: ' + expresion;
    }
}

/**
 * De acuerdo con nuestra gramática, aqui, expresión puede ser una operacion CONCATENACION, CADENA o una expresión numérica
 * @param {*} expresion 
 * @param {TS} tablaDeSimbolos
 * Evaluamos cada caso para resolver a un valor tipo cadena de acuerdo al tipo de operación.
 */
function procesarExpresionCadena(expresion, tablaDeSimbolos) {
    if (expresion.tipo === TIPO_OPERACION.CONCATENACION) {
        // Es una operación de concatenación.
        // En este caso necesitamos procesar los operandos antes de realizar la concatenación.
        // Para esto invocamos (recursivamente) esta función para resolver los valores de los operandos.
        const cadIzq = procesarExpresionCadena(expresion.operandoIzq, tablaDeSimbolos).valor;      // resolvemos el operando izquierdo.
        const cadDer = procesarExpresionCadena(expresion.operandoDer, tablaDeSimbolos).valor;      // resolvemos el operando derecho.
        // Retornamos el resultado de la operación de concatenación.
        const res=cadIzq + cadDer;
        return {valor: res, tipo: TIPO_DATO.STRING};   

    } else if (expresion.tipo === TIPO_VALOR.CADENA) {
        // Es una cadena.
        // En este caso únicamente retornamos el valor obtenido por el parser directamente.
        return {valor: expresion.valor, tipo: TIPO_DATO.STRING };
    } else {
        // Es una epresión numérica.
        // En este caso invocamos la función que se encarga de procesar las expresiones numéricas
        // y retornamos su valor en cadena.
        return procesarExpresionNumerica(expresion, tablaDeSimbolos);
    }
}

/**
 * De acuerdo con nuestra gramática, aqui, expresión puede ser una operación relacional MAYOR QUE, MENOR QUE, MAYOR IGUAL QUE, MENOR IGUAL QUE, IGUAL QUE o NO IGUAL QUE
 * @param {*} expresion 
 * @param {TS} tablaDeSimbolos
 * Evaluamos cada caso para resolver a un valor tipo booleando de acuerdo al tipo de operación.
 */
function procesarExpresionRelacional(expresion, tablaDeSimbolos) {
    // En este caso necesitamos procesar los operandos antes de realizar la comparación.
    let valorIzq = procesarExpresionNumerica(expresion.operandoIzq, tablaDeSimbolos);      // resolvemos el operando izquierdo.
    let valorDer = procesarExpresionNumerica(expresion.operandoDer, tablaDeSimbolos);      // resolvemos el operando derecho.
    if(valorIzq.tipo!==TIPO_DATO.NUMERO || valorDer.tipo!==TIPO_DATO.NUMERO){
        throw 'ERROR: se esperaban expresiones numericas para ejecutar la: ' + expresion.tipo;
    }else{
        valorIzq=valorIzq.valor;
        valorDer=valorDer.valor;
    }

    if (expresion.tipo === TIPO_OPERACION.MAYOR_QUE) return valorIzq > valorDer;
    if (expresion.tipo === TIPO_OPERACION.MENOR_QUE) return valorIzq < valorDer;
    if (expresion.tipo === TIPO_OPERACION.MAYOR_IGUAL) return valorIzq >= valorDer;
    if (expresion.tipo === TIPO_OPERACION.MENOR_IGUAL) return valorIzq <= valorDer;
    if (expresion.tipo === TIPO_OPERACION.DOBLE_IGUAL) return valorIzq === valorDer;
    if (expresion.tipo === TIPO_OPERACION.NO_IGUAL) return valorIzq !== valorDer;
}

/**
 * De acuerdo con nuestra gramática, aqui, expresión puede ser una operación lógica AND, OR o NOT
 * @param {*} expresion 
 * @param {TS} tablaDeSimbolos
 * Evaluamos cada caso para resolver a un valor tipo booleando de acuerdo al tipo de operación.
 */
function procesarExpresionLogica(expresion, tablaDeSimbolos) {

    if (expresion.tipo === TIPO_OPERACION.AND) { 
        // En este caso necesitamos procesar los operandos para &&.
        const valorIzq = procesarExpresionRelacional(expresion.operandoIzq, tablaDeSimbolos);      // resolvemos el operando izquierdo.
        const valorDer = procesarExpresionRelacional(expresion.operandoDer, tablaDeSimbolos);      // resolvemos el operando derecho.
        return valorIzq && valorDer;
    }
    if (expresion.tipo === TIPO_OPERACION.OR) { 
        // En este caso necesitamos procesar los operandos para ||.
        const valorIzq = procesarExpresionRelacional(expresion.operandoIzq, tablaDeSimbolos);      // resolvemos el operando izquierdo.
        const valorDer = procesarExpresionRelacional(expresion.operandoDer, tablaDeSimbolos);      // resolvemos el operando derecho.
        return valorIzq || valorDer;
    }
    if (expresion.tipo === TIPO_OPERACION.NOT) { 
        // En este caso necesitamos procesar solamente un operando para !.
        const valor = procesarExpresionRelacional(expresion.operandoIzq, tablaDeSimbolos);      // resolvemos el operando izquierdo.
        return !valor;
    }
    return procesarExpresionRelacional(expresion, tablaDeSimbolos);
}

/**
 * Función que se encarga de procesar la instrucción Imprimir
 * @param {*} instruccion 
 * @param {*} tablaDeSimbolos 
 */
function procesarImprimir(instruccion, tablaDeSimbolos) {
    const cadena = procesarExpresionCadena(instruccion.expresionCadena, tablaDeSimbolos).valor;
    console.log('> ' + cadena);
}

/**
 * Función que se encarga de procesar la instrucción Declaración
 * @param {*} instruccion 
 * @param {*} tablaDeSimbolos 
 */
function procesarDeclaracion(instruccion, tablaDeSimbolos) { //aqui cambiamos para que acepte el tipo_dato de la declaracion
    tablaDeSimbolos.agregar(instruccion.identificador, instruccion.tipo_dato);
}

/**
 * Función que se encarga de procesar la instrucción Asignación
 * @param {*} instruccion 
 * @param {*} tablaDeSimbolos 
 */
function procesarAsignacion(instruccion, tablaDeSimbolos) {
    const valor = procesarExpresionCadena(instruccion.expresionNumerica, tablaDeSimbolos); //aqui quiero que retorne: tipo y valor
    tablaDeSimbolos.actualizar(instruccion.identificador, valor);
}

/**
 * Función que se encarga de procesar la instrucción Mientras
 */
function procesarMientras(instruccion, tablaDeSimbolos) {
    while (procesarExpresionLogica(instruccion.expresionLogica, tablaDeSimbolos)) {
        const tsMientras = new TS(tablaDeSimbolos.simbolos);
        procesarBloque(instruccion.instrucciones, tsMientras);
    }
}

/**
 * Función que se encarga de procesar la instrucción Para
 */
function procesarPara(instruccion, tablaDeSimbolos) {
    const valor = procesarExpresionCadena(instruccion.valorVariable, tablaDeSimbolos); //aqui quiero que retorne: tipo y valor
    tablaDeSimbolos.actualizar(instruccion.variable, valor);
    for (var i = tablaDeSimbolos.obtener(instruccion.variable); procesarExpresionLogica(instruccion.expresionLogica, tablaDeSimbolos);
        tablaDeSimbolos.actualizar(instruccion.variable, {valor: tablaDeSimbolos.obtener(instruccion.variable).valor + 1, tipo: TIPO_DATO.NUMERO})) {
        const tsPara = new TS(tablaDeSimbolos.simbolos);
        procesarBloque(instruccion.instrucciones, tsPara);
    }
}

/**
 * Función que se encarga de procesar la instrucción If
 */
function procesarIf(instruccion, tablaDeSimbolos) {
    const valorCondicion = procesarExpresionLogica(instruccion.expresionLogica, tablaDeSimbolos);

    if (valorCondicion) {
        const tsIf = new TS(tablaDeSimbolos.simbolos);
        procesarBloque(instruccion.instrucciones, tsIf);
    }
}

/**
 * Función que se encarga de procesar la instrucción If-Else
 * @param {*} instruccion 
 * @param {*} tablaDeSimbolos 
 */
function procesarIfElse(instruccion, tablaDeSimbolos) {
    const valorCondicion = procesarExpresionLogica(instruccion.expresionLogica, tablaDeSimbolos);

    if (valorCondicion) {
        const tsIf = new TS(tablaDeSimbolos.simbolos);
        procesarBloque(instruccion.instruccionesIfVerdadero, tsIf);
    } else {
        const tsElse = new TS(tablaDeSimbolos.simbolos);
        procesarBloque(instruccion.instruccionesIfFalso, tsElse);
    }
}
  
/**
 * Función que se encarga de procesar la instrucción Switch
 * @param {*} instruccion 
 * @param {*} tablaDeSimbolos 
 */
function procesarSwitch(instruccion, tablaDeSimbolos) {
    var evaluar = true;
    const valorExpresion = procesarExpresionNumerica(instruccion.expresionNumerica, tablaDeSimbolos);
    const tsSwitch = new TS(tablaDeSimbolos.simbolos);

    instruccion.casos.forEach(caso => {
        if (caso.tipo == TIPO_OPCION_SWITCH.CASO){
            const valorExpCase= procesarExpresionNumerica(caso.expresionNumerica, tsSwitch);
            if (valorExpCase == valorExpresion){
                procesarBloque(caso.instrucciones, tsSwitch);
                evaluar = false;
            }
        }
        else{
            if (evaluar)
                procesarBloque(caso.instrucciones, tsSwitch);
        }
    });
}

  
/**
 * Función que se encarga de procesar la instrucción Asignación Simplificada
 Se crea un objeto tipo nuevaOperacionBinaria (expresion):
  opIzq      -> Valor almacenado del identificador
  opDer      -> Valor de entrada
  TIPO_VALOR -> Se define por el tipo de operador (+,-,*,/)
 * @param {*} instruccion
 * @param {*} tablaDeSimbolos 
 */
function procesarAsignacionSimplificada(instruccion, tablaDeSimbolos) {
    const expresion =instruccionesAPI.nuevoOperacionBinaria(instruccionesAPI.nuevoValor(instruccion.identificador, TIPO_VALOR.IDENTIFICADOR),instruccion.expresionNumerica, instruccion.operador);
    const valor = procesarExpresionNumerica(expresion, tablaDeSimbolos);

    tablaDeSimbolos.actualizar(instruccion.identificador, valor);
 }
