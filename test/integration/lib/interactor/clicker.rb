require 'interactor/shared'

module Interactor
  module Clicker
    class << self
      include Shared

      def click_on(position)
        delta = Benchmark.realtime do
          run("xdotool mousemove --sync #{position.first} #{position.last} click --clearmodifiers 1")
        end
        somethings_wrong if delta > 1
        sleep 1
      end

      def somethings_wrong
        puts "Click was too slow"
        system('top -n 1')
        sleep 3600
        system('top -n 1')
      end
    end
  end
end
