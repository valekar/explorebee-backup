=begin
uri = URI.parse(ENV["REDISTOGO_URL"] || "redis://localhost:6379/" )
$redis = Redis.new(:host => uri.host, :port => .port, :password => uri.password)



=end


require "redis"

def r
  begin
    $redis ||= Redis.new
    $redis.inspect # needed to know if connection failed
  rescue
    $redis = Redis.new(:path => "/tmp/redis.sock")
  end
  $redis
end
