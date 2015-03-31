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
    var InstallMissingExtensionsDialog = require("widgets/InstallMissingExtensionsDialog");
    
    var requiredExtensions = [];
    
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