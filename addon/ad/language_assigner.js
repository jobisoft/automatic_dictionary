import { PersistentObject } from "./../lib/persistent_object.js";
import { LRUHash } from "./../lib/lru_hash.js";
import { EventDispatcher } from './../lib/event_dispatcher.js';
import { Recipients } from './recipients.js';

export const LanguageAssigner = function(logger, storage){
  this.logger = logger;
  this.storage = storage;

  this.initializeData();
}

LanguageAssigner.prototype = {
  ADDRESS_INFO_KEY: 'addressesInfo',
  initializeData: function(){
    const _this = this;
    var persistent_wrapper = new PersistentObject(
      this.ADDRESS_INFO_KEY,
      this.storage,
      {
        read:["get", "keys", "pairs", "size","setExpirationCallback"],
        write:["set"],
        serializer: "toJSON",
        loader:"fromJSON",
        logger: this.logger
      },
      async function(){
        return new LRUHash({}, {
          logger: _this.logger,
          size: await _this.storage.get('addressesInfo.maxSize')
        });
      }
    );
    persistent_wrapper.setExpirationCallback(function(pair){
      _this.dispatchEvent({
        type: 'assignment-removed',
        recipientsKey: pair[0],
        language:pair[1]
      });
    });
    this.data = persistent_wrapper;
  },
  languageChanged: async function(ad, context, maxRecipients, stats){
    if( this.tooManyRecipients(context, maxRecipients) ){
      this.logger.warn("Discarded to save data. Too much recipients (maxRecipients is "+maxRecipients+").");
      await ad.changeLabel( "warn", ad.ft("DiscardedUpdateTooMuchRecipients", [maxRecipients] ));
      ad.last_lang_discarded = context.language;
      return;
    }
    this.logger.debug("Lang: "+ context.language + " last_lang: "+ad.last_lang);
    if (context.language == ad.last_lang && !ad.contextChangedSinceLast(context)){
      this.logger.debug('Same language and recipients as before '+context.language);
      return;
    }
    ad.last_lang_discarded = false;
    if(context.recipients.to.length == 0){
      this.logger.debug('Empty recipients, skipping language changed')
      return;
    }
    await this.assignLangToFullCombination(context, context.language, stats);
    await this.assignLangToFullTo(context, context.language, stats);
    await this.assignLangToAllIndividuallyIfNew(context, context.language, stats);
  },

  tooManyRecipients: function(context, maxRecipients){
    return context.recipients.to.length + context.recipients.cc.length > maxRecipients
  },

  assignLangToFullCombination: async function(context, lang, stats){
    await this.saveRecipientsToStructures(context.recipients, lang, stats,
      { force: true });
  },
  assignLangToFullTo: async function(context, lang, stats){
    if(context.recipients.to.length == 1) return;

    await this.saveRecipientsToStructures({to: context.recipients.to}, lang, stats,
      { force: true });
  },

  assignLangToAllIndividuallyIfNew: async function(context, lang, stats){
    const all = context.recipients.to.concat(context.recipients.cc);
    for( var i in all ){
      await this.saveRecipientsToStructures({to:[all[i]]}, lang, stats);
    }
  },
  // @param recipients [Hash] with "to" and "cc" keys
  saveRecipientsToStructures: async function(recipients, lang, stats, options){
    options = options || {};
    var key = Recipients.getKeyForRecipients(recipients);
    var force = options.force;
    var previous_language = await this.getLangFor(key);
    const language_changed = previous_language && previous_language != lang;

    if( !previous_language || (force && language_changed) ){
      // Store it!
      this.logger.debug("assigning language "+ lang + " to key "+ key);
      await this.data.set(key, lang);
      this.dispatchEvent({
        type: 'assignment-changed',
        recipients: recipients,
        recipients_key: key,
        previous_language: previous_language,
        language: lang
      })

      stats.saved_recipients++;
    }
  },

  getLangFor: async function( addr ){
    var value = await this.data.get(addr);
    if((typeof value) == "undefined" || value === "") value = null;

    return Promise.resolve(value);
  }
}
Object.assign(LanguageAssigner.prototype, EventDispatcher);