
//A component can be shutten down unregistering from what had done
export const Shutdownable = {
  shutdown_chain: [],
  addListener: function (target, func) {
    target.addListener(func);
    this.shutdown_chain.push(function () {
      target.removeListener(func);
    });
  },

  shutdown: function () {
    this.logger.debug("Shutdown...");
    for (var x = 0; x < this.shutdown_chain.length; x++) {
      try {
        this.logger.debug("Shutdown chain " + x + "/" + this.shutdown_chain.length);
        this.shutdown_chain[x]();
      } catch (e) {
        AutomaticDictionary.logException(e);
      }
    }
  }
}