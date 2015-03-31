/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, Mustache, brackets */

define(function (require, exports, module) {
    "use strict";
    
    function show(missingExtensions) {
        var dialogBody = '';
        var InstallExtensionsBodyTemplate = require("text!templates/install-missing-extensions-body-dialog.html");
        var Package = brackets.getModule("extensibility/Package");
        var ExtensionManager = brackets.getModule("extensibility/ExtensionManager");

        dialogBody = Mustache.render(InstallExtensionsBodyTemplate, {extensions: missingExtensions});

        var Dialogs = brackets.getModule('widgets/Dialogs');
        var dialog = Dialogs.showModalDialog(
            'testing',
            'Test',
            dialogBody,
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

        $dlg.one("buttonClick", function (e, id) {
            console.log(id);
            if (id === 'missing-install') {
                $dlg.find('.install-status').append('<h4>Installing...</h4>');

                var InstallExtensionDialog = brackets.getModule('extensibility/InstallExtensionDialog');
                var missingExtensionsCounter = 0;

                missingExtensions.forEach(
                    function (missingExtension) {
                        Package.installFromURL(
                            ExtensionManager.getExtensionURL(missingExtension.id, missingExtension.version)
                        ).promise.then(
                            function (missingExtension) {
                                ++missingExtensionsCounter;
                                console.log(missingExtension.id, "installed");
                                if (missingExtensionsCounter >= missingExtensions.length) {
                                    dialog.close();
                                }
                            }
                        );
                    }
                );
            } else {
                dialog.close();
            }
        });

    }

    module.exports.show = show;
});