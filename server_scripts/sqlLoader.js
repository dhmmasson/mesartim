var fs = require( "fs" )
	, _path = require("path")
module.exports = loadSqlFiles ; 

function loadSqlFiles( ...folderOrFiles ) {
	return new Promise( function ( resolve, reject ) { 
		expandsFilesAndFolders
			.apply( this, folderOrFiles )
			.then( loadFiles )
			.then( resolve )
			.catch( reject )
	})
}

/**
* promise an array of filenames corresponding to the file pointed by path
* @params can be one array of paths or multiple paths ( but not a combinaison ) 
*	if path are folders all included files are added ( recursively )
*/
function expandsFilesAndFolders( ...path ) {
	var expansion = []
	//Sub routine to handle array of file
	function auxArray( dir, files ) {
		if( typeof files == "string" ) return aux(  _path.join(dir, files) ) ;
		var promises = [] ;
		for( var i in files ) {
			var filename = _path.join( dir, files[ i ] ) 
			if( !(/([.]?[#].*)|.*~$/).test( filename ) ) 
				promises.push( aux( filename ) ) ;
		}
		return Promise.all( promises ) ;
	}
	//Sub routine to handle an unique file/folder
	function aux( path ) {		
		return new Promise( function( resolve, reject ) {
				//Check if actual file or a directory 	
			fs.stat( path, ( err, stats ) => {
				if( err ) {
					reject( "expandsFilesAndFolders:: can't read stats of " + path + "; " + err ) ; 
				}	else {
					//If path is a directory, treat each of its files
					if( stats.isDirectory()) {
						fs.readdir( path, (err, files ) => {
							if( err ) {
								reject( "expandsFilesAndFolders:: can't read directory of " + path + "; " + err ) ; 
							}	else {
								//Forward resolve and reject...
								auxArray( path, files )
									.then( resolve )
									.catch( reject ) ;
							}
						})
					}
					if( stats.isFile() ) {
						expansion.push( path ) ;
						resolve( expansion )				
					}
				}
			})
		})
	}
	//Clean param, if array of array 
	if( path.length == 1 && path[0] instanceof Array ) path = path[0]
	//Create intermediary promise to clean the return value 
	return new Promise( ( resolve, reject ) =>  
		auxArray( "", path )
			.then( ()=>resolve( expansion ))
			.catch( reject ))

}

/**
*	Promise to load an object containing the @name of the file and @data corresponding
* if file is just a filename,   @name = filename
* if file is { name, filename }  @name = name
*/
function loadFile( file ) {
	console.log( "loadFile", file )
	var name = file ;
	//Test if file is an options object
	if( typeof file == "object", file.hasOwnProperty( name ) ) {
		name = file.name ;
		file = file.filename ; 
	}
	name = _path.parse( name )
	name = _path.join( name.dir , name.name ).split( _path.sep ).join( "." ) 
	
	//Create and return the promise
	return new Promise( 
		( resolve, reject ) => {
			fs.readFile( file, handle )
			function handle( err, buffer ) {
				if( err ) reject( err ) ; 
				else 			resolve( {name : name, data: buffer })
			}
		}											
	)
}

/**
*	Promise to load multiple files into an object { name1 : data1, name2: data2 ...} 
* @param fileNames either an array of filenames (string) either an array of Object { name, filename }
*/
function loadFiles( fileNames ) {
	while( fileNames.length == 1 && fileNames[0] instanceof Array ) fileNames = fileNames[0]
	console.log( "loadFiles", fileNames)
	//Get a promise for each file
	var promises = [] 
	for( var i in fileNames ) {
		promises.push( loadFile( fileNames[i] ) ) ;
	}
	//resolve the promise when all files are done, and consolidated the results as one object
	return new Promise( ( resolve, reject ) => 
		Promise.all( promises )
			.then( ( files ) => {
				var result = {}
				for( var i in files ) {
					//Transform the name "something.toto.toto" in the object something { toto : { toto : {} } }
					//Does what it's supposed to but I don't like it ( target_1 to remember correct name, one too much object creation.. use of j outside its scope..)
					var name = files[i].name.split(".") 
					, target = result 
					, target_1 = null 	
					for( var j in name ) { 
						target_1 = target
						if( !target.hasOwnProperty( name[ j ] ) ) target[ name[ j ] ] = {}
						target =  target[ name[ j ] ] 
					}
					target_1[ name[ j ]] = files[i].data.toString()				
				}
				resolve( result ) ;
			})
			.catch( reject )
	)
}
