/**
 * Ejemplo Intérprete Sencillo con Jison utilizando Nodejs en Ubuntu
 */

/* Definición Léxica */
%lex

%options case-insensitive

%%

\s+											// se ignoran espacios en blanco
"//".*										// comentario simple línea
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]			// comentario multiple líneas

"imprimir"			return 'RIMPRIMIR';
"numero"			return 'RNUMERO';
"string"			return 'RSTRING';
"mientras"			return 'RMIENTRAS';
"if"				return 'RIF';
"else"				return 'RELSE';
"para"				return 'RPARA';
"switch"			return 'RSWITCH';
"case"				return 'RCASE';
"default"			return 'RDEFAULT';
"break"				return 'RBREAK';

":"					return 'DOSPTS';
";"					return 'PTCOMA';
"{"					return 'LLAVIZQ';
"}"					return 'LLAVDER';
"("					return 'PARIZQ';
")"					return 'PARDER';

"+="				return 'O_MAS';
"-="				return 'O_MENOS';
"*="				return 'O_POR';
"/="				return 'O_DIVIDIDO';
"&&"				return 'AND'
"||"				return 'OR';

"+"					return 'MAS';
"-"					return 'MENOS';
"*"					return 'POR';
"/"					return 'DIVIDIDO';
"&"					return 'CONCAT';

"<="				return 'MENIGQUE';
">="				return 'MAYIGQUE';
"=="				return 'DOBLEIG';
"!="				return 'NOIG';

"<"					return 'MENQUE';
">"					return 'MAYQUE';
"="					return 'IGUAL';

"!"					return 'NOT';

\"[^\"]*\"				{ yytext = yytext.substr(1,yyleng-2); return 'CADENA'; }
[0-9]+("."[0-9]+)?\b  	return 'DECIMAL';
[0-9]+\b				return 'ENTERO';
([a-zA-Z])[a-zA-Z0-9_]*	return 'IDENTIFICADOR';


<<EOF>>				return 'EOF';
.					{ console.error('Este es un error léxico: ' + yytext + ', en la linea: ' + yylloc.first_line + ', en la columna: ' + yylloc.first_column); }

/lex


%{
	const TIPO_OPERACION	= require('./instrucciones').TIPO_OPERACION;
	const TIPO_VALOR 		= require('./instrucciones').TIPO_VALOR;
	const TIPO_DATO			= require('./tabla_simbolos').TIPO_DATO; //para jalar el tipo de dato
	const instruccionesAPI	= require('./instrucciones').instruccionesAPI;
%}


/* Asociación de operadores y precedencia */
%left 'CONCAT'
%left 'MAS' 'MENOS'
%left 'POR' 'DIVIDIDO'
%left UMENOS

%start ini

%% /* Definición de la gramática */

ini
	: instrucciones EOF {
		// cuado se haya reconocido la entrada completa retornamos el AST
		return $1;
	}
;

instrucciones
	: instrucciones instruccion 	{ $1.push($2); $$ = $1; }
	| instruccion					{ $$ = [$1]; }
;

instruccion
	: RIMPRIMIR PARIZQ expresion_cadena PARDER PTCOMA	{ $$ = instruccionesAPI.nuevoImprimir($3); }
	| RMIENTRAS PARIZQ expresion_logica PARDER LLAVIZQ instrucciones LLAVDER
														{ $$ = instruccionesAPI.nuevoMientras($3, $6); }
	| RPARA PARIZQ IDENTIFICADOR IGUAL expresion_numerica PTCOMA expresion_logica PTCOMA IDENTIFICADOR MAS MAS PARDER LLAVIZQ instrucciones LLAVDER
														{ $$ = instruccionesAPI.nuevoPara($3,$5,$7,$9,$14) }
	| RNUMERO IDENTIFICADOR PTCOMA						{ $$ = instruccionesAPI.nuevoDeclaracion($2, TIPO_DATO.NUMERO); }
	| RSTRING IDENTIFICADOR PTCOMA						{ $$ = instruccionesAPI.nuevoDeclaracion($2, TIPO_DATO.STRING); }
	| IDENTIFICADOR IGUAL expresion_cadena PTCOMA		{ $$ = instruccionesAPI.nuevoAsignacion($1, $3); } //esto soporta expresiones_cadena y expresion_numerica

	| RIF PARIZQ expresion_logica PARDER LLAVIZQ instrucciones LLAVDER
														{ $$ = instruccionesAPI.nuevoIf($3, $6); }
	| RIF PARIZQ expresion_logica PARDER LLAVIZQ instrucciones LLAVDER RELSE LLAVIZQ instrucciones LLAVDER
														{ $$ = instruccionesAPI.nuevoIf($3, $6, $10); }

	| RSWITCH PARIZQ expresion_numerica PARDER LLAVIZQ casos LLAVDER
		{ $$ = instruccionesAPI.nuevoSwitch($3,$6);}
	| IDENTIFICADOR operadores expresion_numerica PTCOMA	
	                                                    { $$ = instruccionesAPI.nuevoAsignacionSimplificada($1, $2, $3); }
	| error { console.error('Este es un error sintáctico: ' + yytext + ', en la linea: ' + this._$.first_line + ', en la columna: ' + this._$.first_column); }
;

casos : casos caso_evaluar
    {
      $1.push($2);
	  $$ = $1;
    }
  | caso_evaluar
  	{ $$ = instruccionesAPI.nuevoListaCasos($1);}
;

caso_evaluar : RCASE expresion_numerica DOSPTS instrucciones
    { $$ = instruccionesAPI.nuevoCaso($2,$4); }
  | RDEFAULT DOSPTS instrucciones
    { $$ = instruccionesAPI.nuevoCasoDef($3); }
;

operadores
    : O_MAS      { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.SUMA); }
	| O_MENOS    { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.RESTA); }
    | O_POR      { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.MULTIPLICACION); }
	| O_DIVIDIDO { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.DIVISION); }
;


expresion_numerica
	: MENOS expresion_numerica %prec UMENOS				{ $$ = instruccionesAPI.nuevoOperacionUnaria($2, TIPO_OPERACION.NEGATIVO); }
	| expresion_numerica MAS expresion_numerica			{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.SUMA); }
	| expresion_numerica MENOS expresion_numerica		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.RESTA); }
	| expresion_numerica POR expresion_numerica			{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MULTIPLICACION); }
	| expresion_numerica DIVIDIDO expresion_numerica	{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.DIVISION); }
	| PARIZQ expresion_numerica PARDER					{ $$ = $2; }
	| ENTERO											{ $$ = instruccionesAPI.nuevoValor(Number($1), TIPO_VALOR.NUMERO); }
	| DECIMAL											{ $$ = instruccionesAPI.nuevoValor(Number($1), TIPO_VALOR.NUMERO); }
	| IDENTIFICADOR										{ $$ = instruccionesAPI.nuevoValor($1, TIPO_VALOR.IDENTIFICADOR); }
;

expresion_cadena
	: expresion_cadena CONCAT expresion_cadena			{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.CONCATENACION); }
	| CADENA											{ $$ = instruccionesAPI.nuevoValor($1, TIPO_VALOR.CADENA); }
	| expresion_numerica								{ $$ = $1; }
;

expresion_relacional
	: expresion_numerica MAYQUE expresion_numerica		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MAYOR_QUE); }
	| expresion_numerica MENQUE expresion_numerica		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MENOR_QUE); }
	| expresion_numerica MAYIGQUE expresion_numerica	{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MAYOR_IGUAL); }
	| expresion_numerica MENIGQUE expresion_numerica	{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MENOR_IGUAL); }
	| expresion_cadena DOBLEIG expresion_cadena			{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.DOBLE_IGUAL); }
	| expresion_cadena NOIG expresion_cadena			{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.NO_IGUAL); }
;

expresion_logica
	: expresion_relacional AND expresion_relacional     { $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.AND); }
	| expresion_relacional OR expresion_relacional 		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.OR); }
	| NOT expresion_relacional							{ $$ = instruccionesAPI.nuevoOperacionUnaria($2, TIPO_OPERACION.NOT); }
	| expresion_relacional								{ $$ = $1; }
;
