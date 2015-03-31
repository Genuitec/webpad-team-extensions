/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        Package = brackets.getModule("extensibility/Package");

    var ExtensionManager = brackets.getModule("extensibility/ExtensionManager");
    var _  = brackets.getModule("thirdparty/lodash");
    
    var requiredExtensions = [];
    
    ProjectManager.on("projectOpen", function () {
        var baseURL = ProjectManager.getProjectRoot().fullPath;
        console.log('projectu url', baseURL);
        var file = baseURL+ '.team.extensions';
        
        FileUtils.readAsText( FileSystem.getFileForPath( file ) )
        .then( function(text) {
            requiredExtensions = JSON.parse( text );
            
            return ExtensionManager.downloadRegistry();
        })                
        .then(function () {
            console.group('Missing extensions');
            var missingExtensions = [];
            _.each(ExtensionManager.extensions, function (value, key) {
                requiredExtensions.forEach( function (requiredExtension ) {                    
                    if (key === requiredExtension.id && typeof value.installInfo === 'undefined') {
                        console.log(key);
                        console.log(value);
                        missingExtensions.push( requiredExtension );
                    }
                });
                
            });
            console.groupEnd();
            
            return missingExtensions;
        })
        .then( function ( missingExtensions ) { 
            if (missingExtensions.length > 0) {
                var dialogContent = '';
            var dialogTemplate = ''+
                '<h3>Missing Extensions</h3>'+
                '<ul>'+
                    '{{#extensions}}'+
                    '<i>{{id}}</i> <strong>({{version}})</strong>'+
                    '{{/extensions}}'+
                '</ul>'+
                '<div class="install-status"></div>';
            dialogContent = Mustache.render(dialogTemplate, {extensions: missingExtensions});
  
            var Dialogs = brackets.getModule('widgets/Dialogs');
            var dialog = Dialogs.showModalDialog( 
                'testing',
                'Test',
                dialogContent,
                [
                    { 
                        className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id: 'missing-install',
                        text: 'Install'
                    },
                    { 
                        className: Dialogs.DIALOG_BTN_CANCEL,
                        id: Dialogs.DIALOG_BTN_CANCEL,
                        text: Dialogs.DIALOG_BTN_CANCEL
                    }
                ],
                false
            );
            var $dlg = dialog.getElement();
            
            $dlg.one( "buttonClick", function( e, id ) {
                console.log(id);
                if ( id == 'missing-install' ) {
                    $dlg.find('.install-status').append('<h4>Installing...</h4>');
                    var InstallExtensionDialog = brackets.getModule('extensibility/InstallExtensionDialog');
                    var missingExtensionsCounter = 0;
                    missingExtensions.forEach( function (missingExtension) {
                        Package.installFromURL( ExtensionManager.getExtensionURL(missingExtension.id, missingExtension.version) )
                    .promise.then( function (missingExtension) {
                            ++missingExtensionsCounter;
                        console.log( missingExtension.id, "installed"  );
                            if (missingExtensionsCounter >= missingExtensions.length) {
                                dialog.close();
                            }
                       });                
                    }); 
                } else {
                    dialog.close();
                }
                
            });

            }
                        
            
        })
        .done();
    });
});