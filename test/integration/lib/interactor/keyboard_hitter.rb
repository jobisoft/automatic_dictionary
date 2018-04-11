require 'interactor/shared'

module Interactor
  module KeyboardHitter
    class << self
      include Shared

      def hit_key(key, options = {})
        options = {clear_modifiers: true}.merge(options)
        sleep 0.5
        clear = '--clearmodifiers' if options[:clear_modifiers]
        run("xdotool key #{clear} #{key}")
      end

      def input_text(text)
        escaped_text = text.gsub("'",'\\')
        run("xdotool type -clearmodifiers '#{escaped_text}'")
      end
    end
  end
end
