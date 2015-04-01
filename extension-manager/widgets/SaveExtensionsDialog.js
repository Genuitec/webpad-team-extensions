/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function (require, exports, module) {
    "use strict";

    var SAVE_EXTENSIONS_DIALOG_ID = "save-extensions-dialog",
        SAVE_EXTENSIONS_DIALOG_TITLE = "Save Extensions",
        SAVE_BUTTON_ID = "save-extensions-save-button",
        SAVE_BUTTON_LABEL = "Save",
        DIALOG_CLASS = "save-extensions-dialog";
    
    function show(installedExtensions) {
        var SaveExtensionsBodyTemplate = require("text!templates/save-extensions-body-dialog.html"),
            ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
            FileSystem = brackets.getModule("filesystem/FileSystem"),
            FileUtils = brackets.getModule("file/FileUtils"),
            ProjectManager = brackets.getModule("project/ProjectManager"),
            Dialogs = brackets.getModule('widgets/Dialogs');
        
        var dialog = Dialogs.showModalDialog(
            DIALOG_CLASS,
            SAVE_EXTENSIONS_DIALOG_TITLE,
            Mustache.render(SaveExtensionsBodyTemplate, {extensions: installedExtensions}),
            [
                {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: SAVE_BUTTON_ID,
                    text: SAVE_BUTTON_LABEL
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
        var deferred = $.Deferred();

        $dlg.one("buttonClick", function (e, id) {
            if (id === SAVE_BUTTON_ID) {
                
                var baseURL = ProjectManager.getProjectRoot().fullPath;
                var filePath = baseURL + '.team.extensions';

                var file = FileSystem.getFileForPath(filePath);
                var fileContents = JSON.stringify(installedExtensions, null, 4);
                FileUtils.writeText(file, fileContents, true).then(
                    function () {
                        deferred.resolve();
                    },
                    function () {
                        console.log("Error while writing extensions");
                    }
                );
            } else {
                dialog.close();
            }
        });
        
        return deferred.promise;
    }

    module.exports.show = show;
});