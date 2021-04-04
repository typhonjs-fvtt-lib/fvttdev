import * as vm from '@typhonjs-fvtt/validate-manifest';

/**
 * Provides a TyphonJS plugin to wire up the validator functions on a plugin eventbus.
 *
 * The following event bindings take a JSON object and options to AJV validator function.
 *
 * `typhonjs:fvtt:validate:manifest:module` - Invokes validateModule
 * `typhonjs:fvtt:validate:manifest:module:strict` - Invokes validateModuleStrict
 * `typhonjs:fvtt:validate:manifest:plus:module` - Invokes validateModulePlus
 * `typhonjs:fvtt:validate:manifest:plus:module:strict` - Invokes validateModulePlusStrict
 * `typhonjs:fvtt:validate:manifest:system` - Invokes validateSystem
 * `typhonjs:fvtt:validate:manifest:system:strict` - Invokes validateSystemStrict
 * `typhonjs:fvtt:validate:manifest:plus:system` - Invokes validateSystemPlus
 * `typhonjs:fvtt:validate:manifest:plus:system:strict` - Invokes validateSystemPlusStrict
 */
export default class ValidateManifest
{
   static validateModule(data, options)
   {
      const valid = vm.validateModule(data, options);
      return { valid, errors: vm.validateModule.errors, type: 'module' };
   }

   static validateModulePlus(data, options)
   {
      const valid = vm.validateModulePlus(data, options);
      return { valid, errors: vm.validateModulePlus.errors, type: 'modulePlus' };
   }

   static validateModulePlusStrict(data, options)
   {
      const valid = vm.validateModulePlusStrict(data, options);
      return { valid, errors: vm.validateModulePlusStrict.errors, type: 'modulePlusStrict' };
   }

   static validateModuleStrict(data, options)
   {
      const valid = vm.validateModuleStrict(data, options);
      return { valid, errors: vm.validateModuleStrict.errors, type: 'moduleStrict' };
   }

   static validateSystem(data, options)
   {
      const valid = vm.validateSystem(data, options);
      return { valid, errors: vm.validateSystem.errors, type: 'system' };
   }

   static validateSystemPlus(data, options)
   {
      const valid = vm.validateSystemPlus(data, options);
      return { valid, errors: vm.validateSystemPlus.errors, type: 'systemPlus' };
   }

   static validateSystemPlusStrict(data, options)
   {
      const valid = vm.validateSystemPlusStrict(data, options);
      return { valid, errors: vm.validateSystemPlusStrict.errors, type: 'systemPlusStrict' };
   }

   static validateSystemStrict(data, options)
   {
      const valid = vm.validateSystemStrict(data, options);
      return { valid, errors: vm.validateSystemStrict.errors, type: 'systemStrict' };
   }

   /**
    * Wires up ValidateManifest on the plugin eventbus.
    *
    * @param {object} ev - PluginEvent - The plugin event.
    *
    * @see https://www.npmjs.com/package/typhonjs-plugin-manager
    *
    * @ignore
    */
   static onPluginLoad(ev)
   {
      const eventbus = ev.eventbus;

      eventbus.on(`typhonjs:fvtt:validate:manifest:module`, ValidateManifest.validateModule);
      eventbus.on(`typhonjs:fvtt:validate:manifest:module:strict`, ValidateManifest.validateModuleStrict);
      eventbus.on(`typhonjs:fvtt:validate:manifest:plus:module`, ValidateManifest.validateModulePlus);
      eventbus.on(`typhonjs:fvtt:validate:manifest:plus:module:strict`, ValidateManifest.validateModulePlusStrict);
      eventbus.on(`typhonjs:fvtt:validate:manifest:system`, ValidateManifest.validateSystem);
      eventbus.on(`typhonjs:fvtt:validate:manifest:system:strict`, ValidateManifest.validateSystemStrict);
      eventbus.on(`typhonjs:fvtt:validate:manifest:plus:system`, ValidateManifest.validateSystemPlus);
      eventbus.on(`typhonjs:fvtt:validate:manifest:plus:system:strict`, ValidateManifest.validateSystemPlusStrict);
   }
}
