// Constantes para los tipos de datos.
const TIPO_DATO = {
    NUMERO: 'NUMERO'
}


/**
 * Función que crea objetos de tipo Símbolo.
 * @param {*} id 
 * @param {*} tipo 
 * @param {*} valor 
 */
function crearSimbolo(id, tipo, valor=0) {
    return {
        id: id,
        tipo: tipo,
        valor: valor
    }
}


/**
 * Clase que representa una Tabla de Símbolos.
 */
class TS {

    /**
     * El costructor recibe como parámetro los simbolos de la tabla padre.
     * @param {*} simbolos 
     */
    constructor (simbolos) {
        this._simbolos = simbolos;
    }

    /**
     * Función para gregar un nuevo símbolo.
     * Esta función se usa en la sentencia de Declaración.
     * @param {*} id 
     * @param {*} tipo 
     */
    agregar(id, tipo) {
        const nuevoSimbolo = crearSimbolo(id, tipo);
        this._simbolos.push(nuevoSimbolo);
    }

    /**
     * Función para actualizar el valor de un símbolo existente.
     * Esta función se usa en la sentencia de Asignación.
     * @param {*} id 
     * @param {*} valor 
     */
    actualizar(id, valor) {
        const simbolo = this._simbolos.filter(simbolo => simbolo.id === id)[0];
        if (simbolo) simbolo.valor = valor;
        else throw 'ERROR: variable: ' + id + ' no ha sido definida';
    }

    /**
     * Función para obtener el valor de un símbolo existente.
     * @param {*} id 
     */
    obtener(id) {
        const simbolo = this._simbolos.filter(simbolo => simbolo.id === id)[0];

        if (simbolo) return simbolo.valor;
        else throw 'ERROR: variable: ' + id + ' no ha sido definida';
    }

    /**
     * Función getter para obtener los símbolos.
     */
    get simbolos() {
        return this._simbolos;
    }
}

// Exportamos las constantes y la clase.

module.exports.TIPO_DATO = TIPO_DATO;
module.exports.TS = TS;
