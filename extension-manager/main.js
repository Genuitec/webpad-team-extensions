/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
        _  = brackets.getModule("thirdparty/lodash");
    
    // Extension modules
    var InstallMissingExtensionsDialog = require("widgets/InstallMissingExtensionsDialog"),
        SaveExtensionsDialog = require("widgets/SaveExtensionsDialog");
    
    var requiredExtensions = [];
    var MAIN_MENU_ID = "team-extensions-main";
    var SAVE_EXTENSIONS_COMMAND_ID = "team-extensions-save-extensions";
    
    var WebPadMenu = Menus.addMenu("WebPad", MAIN_MENU_ID);
    
    CommandManager.register("Save Team Extensions", SAVE_EXTENSIONS_COMMAND_ID, function () {
        console.log("Saving team extensions");
        var installedExtensions = [];
        ExtensionManager.downloadRegistry().then(
            function () {
                _.each(ExtensionManager.extensions, function (value, key) {
                    if (typeof value.installInfo !== 'undefined' &&
                            typeof value.registryInfo !== 'undefined' &&
                            value.installInfo.status === "enabled"
                            ) {
                        console.log(key);
                        console.log(value);
                        installedExtensions.push({
                            id: value.installInfo.metadata.name,
                            version: value.installInfo.metadata.version
                        });
                    }
                });
                console.log(installedExtensions);
                return SaveExtensionsDialog.show(installedExtensions);
            }
        ).then(
            function () {
                var baseURL = ProjectManager.getProjectRoot().fullPath;
                var filePath = baseURL + '.team.extensions';
                
                return window.alert("Extensions saved to: " + filePath);
            }
        ).done();
    });
    
    WebPadMenu.addMenuItem(SAVE_EXTENSIONS_COMMAND_ID);
    
    ProjectManager.on("projectOpen", function () {
        var baseURL = ProjectManager.getProjectRoot().fullPath;
        var file = baseURL + '.team.extensions';
        
        FileUtils.readAsText(FileSystem.getFileForPath(file)).then(
            function (text) {
                requiredExtensions = JSON.parse(text);

                return ExtensionManager.downloadRegistry();
            }
        ).then(
            function () {
                console.group('Missing extensions');
                var missingExtensions = [];
                _.each(ExtensionManager.extensions, function (value, key) {
                    requiredExtensions.forEach(function (requiredExtension) {
                        if (key === requiredExtension.id && typeof value.installInfo === 'undefined') {
                            console.log(key);
                            console.log(value);
                            missingExtensions.push(requiredExtension);
                        }
                    });
                });
                console.groupEnd();

                return missingExtensions;
            }
        ).then(
            function (missingExtensions) {
                if (missingExtensions.length > 0) {
                    return InstallMissingExtensionsDialog.show(missingExtensions);
                }
            }
        ).done();
    });
});