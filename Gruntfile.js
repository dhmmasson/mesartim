module.exports = function(grunt) {
  grunt.initConfig(
  { sass: {
      dist: {
        files: 
        { 'css/ideaValuation.css': 'sass/ideaValuation.scss'
       // , 'css/materialize.css': 'sass/materialize.scss'
        }
      }
    }
  , copy: 
    { materializeFont : 
      { files: [ { expand: true
                 , cwd: 'bower_components/Materialize/font/'
                 , src: ['**']
                 , dest: 'fonts/'} ]
      }
    , materializeSassFiles: 
      { files: [ { expand: true
                 , cwd: 'bower_components/Materialize/sass/'
                 , src: ['**']
                 , dest: 'sass/'} ]
      , options: 
        { process: function (content, srcpath) {
          if( srcpath.match("materialize.scss")) { 
            console.log("copy materialize.scss" ); 
            return content.replace('@import "components/variables";', '@import "ideaValuationVariables";\n@import "components/variables";');
          }
          return content 
        } }
      
      }   
    }
});
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['copy', 'sass']);

};