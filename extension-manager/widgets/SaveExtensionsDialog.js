/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function (require, exports, module) {
    "use strict";

    var SAVE_EXTENSIONS_DIALOG_ID = "save-extensions-dialog",
        SAVE_EXTENSIONS_DIALOG_TITLE = "Save Extensions",
        SAVE_BUTTON_ID = "save-extensions-save-button",
        SAVE_BUTTON_LABEL = "Save";
    
    function show(installedExtensions) {
        console.log("Showing extensions dialog");
//        var 
//            SaveExtensionsBodyTemplate = require("text!templates/save-extensions-body-dialog.html"),
        var ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
            FileSystem = brackets.getModule("filesystem/FileSystem"),
            FileUtils = brackets.getModule("file/FileUtils"),
            ProjectManager = brackets.getModule("project/ProjectManager"),
            Dialogs = brackets.getModule('widgets/Dialogs');
        
        
        
//        var dialogBody = Mustache.render(SaveExtensionsBodyTemplate, {extensions: installedExtensions});
//
//        var dialog = Dialogs.showModalDialog(
//            SAVE_EXTENSIONS_DIALOG_ID,
//            SAVE_EXTENSIONS_DIALOG_TITLE,
//            dialogBody,
//            [
//                {
//                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
//                    id: SAVE_BUTTON_ID,
//                    text: SAVE_BUTTON_LABEL
//                },
//                {
//                    className: Dialogs.DIALOG_BTN_CANCEL,
//                    id: Dialogs.DIALOG_BTN_CANCEL,
//                    text: Dialogs.DIALOG_BTN_CANCEL
//                }
//            ],
//            false
//        );
//        var $dlg = dialog.getElement();
//
//        $dlg.one("buttonClick", function (e, id) {
//            console.log(id);
//            if (id === SAVE_BUTTON_ID) {
//                $dlg.find('.install-status').append('<h4>Saving...</h4>');
//
//                var InstallExtensionDialog = brackets.getModule('extensibility/InstallExtensionDialog');
//                var missingExtensionsCounter = 0;
//
//                missingExtensions.forEach(
//                    function (missingExtension) {
//                        Package.installFromURL(
//                            ExtensionManager.getExtensionURL(missingExtension.id, missingExtension.version)
//                        ).promise.then(
//                            function (missingExtension) {
//                                ++missingExtensionsCounter;
//                                console.log(missingExtension.id, "installed");
//                                if (missingExtensionsCounter >= missingExtensions.length) {
//                                    dialog.close();
//                                }
//                            }
//                        );
//                    }
//                );
//            } else {
//                dialog.close();
//            }
//        });
        var deferred = $.Deferred();
        var baseURL = ProjectManager.getProjectRoot().fullPath;
        var filePath = baseURL + '.team.extensions';
        
        var file = FileSystem.getFileForPath(filePath);
        var fileContents = JSON.stringify(installedExtensions, null, 4);
        FileUtils.writeText(file, fileContents, true).then(
            function () {
                deferred.resolve();
            },
            function () {
                console.log("Error while writing extension");
            }
        );
        
        return deferred.promise;
    }

    module.exports.show = show;
});