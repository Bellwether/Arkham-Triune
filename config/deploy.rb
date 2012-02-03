set :application, "arkhamtriune"
set :domain, "ec2-107-22-191-148.compute-1.amazonaws.com"
set :user, "ubuntu"
set :admin_runner, 'ubuntu'
set :use_sudo, false

set :db_host, "ds029787.mongolab.com:29787"
set :db_user, "arkham"
set :db_password, "triune"

set :repository, "git@github.com:Bellwether/Arkham-Triune.git"
set :scm, :git
set :branch, "master"

default_run_options[:pty] = true
ssh_options[:keys] = [File.join(ENV["HOME"], ".ec2", "keypairs", "arkhamtriune.pem")]
ssh_options[:forward_agent] = true
set :scm_verbose, true
set :git_enable_submodules, 1
set :keep_releases, 2

server domain, :app, :web, :db, :primary => true

set :node_file, "main.js"
set :node_env, "production"
set :application_binary, '/usr/bin/node'
set :deploy_to, "/opt/#{application}"

namespace :deploy do
  
  task :migrate, :roles => :app do
  end
  
  desc "Start app using upstart script"  
  task :start, :roles => :app, :except => { :no_release => true } do
    run "sudo start #{application}"
  end

  desc "Stop app using upstart script"
  task :stop, :roles => :app, :except => { :no_release => true } do
    run "sudo stop #{application}"
  end

  desc "Restart app using upstart script"
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "sudo restart #{application} || sudo start #{application}"
  end
    
  desc "Check required packages and install if packages are not installed"
  task :update_packages, roles => :app do
    run "export PATH=#{node_path}:$PATH && cd #{release_path} && npm install"
  end
  
  desc "Update submodules"
  task :update_submodules, :roles => :app do
    run "cd #{release_path}; git submodule init && git submodule update"
  end
  
  desc "Install npm or update it to latest version"
  task :install_npm, :roles => :app do
    run "curl http://npmjs.org/install.sh | sudo sh"
  end

  desc "Create deployment directory"
  task :create_deploy_to_with_sudo, :roles => :app do
    run "sudo mkdir -p #{deploy_to}"
    run "sudo chown #{admin_runner}:#{admin_runner} #{deploy_to}"
  end
    
  desc "Creates SSL key and self-signed certificate"
  task :create_ssl_certificate, :roles => :app do
    set :ssl_key, "/etc/ssl/private/#{application}.key.pem"
    set :ssl_cert, "/etc/ssl/private/#{application}.cert.pem"    
    run "sudo openssl genrsa -out #{ssl_key}"
    run "sudo openssl req -new -key #{ssl_key} -out csr.pem -subj '/C=US/ST=/L=/O=/CN=#{domain}'"
    run "sudo openssl x509 -req -days 9999 -signkey #{ssl_key} -out #{ssl_cert} -in csr.pem"
    run "sudo rm csr.pem"
    # openssl req -new -x509 -nodes -out /etc/ssl/certs/arkham.crt -keyout /etc/ssl/private/arkham.key
    # sudo openssl req -new -x509 -nodes -out /etc/ssl/certs/arkham.crt -keyout /etc/ssl/private/arkham.key
  end  
  
  desc "Writes the upstart script for running the app daemon"
  task :write_upstart_script, :roles => :app do
    upstart_script = <<-UPSTART
  description "#{application}"

  start on (local-filesystem and net-device-up)
  stop on shutdown
  
  respawn
  respawn limit 5 60  

  script
      export HOME="/home/#{admin_runner}"
      export NODE_ENV="#{node_env}"
      cd #{current_path}
      exec sudo sh -c "NODE_ENV=#{node_env} #{application_binary} #{current_path}/#{node_file} >> #{shared_path}/log/#{node_env}.log 2>&1"
  end script
  respawn
UPSTART
  put upstart_script, "/tmp/#{application}.conf"
    run "sudo mv /tmp/#{application}.conf /etc/init/#{application}.conf"
  end  
end

namespace :logs do
  desc "Tails node production log"
  task :tail, :roles => :app do
    run "tail -500 #{shared_path}/log/#{node_env}.log"
  end

  desc "Empty node production log"  
  task :clear, :roles => :app do  
    run "> #{shared_path}/log/#{node_env}.log"
  end
end

namespace :aptget do
  desc "Updates apt-get package list"
  task :update, :roles => :app do
    run "sudo apt-get update"
  end
  
  desc "Upgrades system packages"
  task :upgrade, :roles => :app do
    run "sudo apt-get upgrade -y"
  end
    
  desc "Sets default server localization"
  task :timezone, :roles => :app do
    run "sudo locale-gen en_GB.UTF-8"
    run "sudo /usr/sbin/update-locale LANG=en_GB.UTF-8"
  end  
end

namespace :instance do
  desc "Displays the installed app versions on the stack"
  task :stack, :roles => :app do
    run "node -v"
    run "npm -v"    
  end
    
  desc "Show the amount of free disk space."
  task :disk_space, :roles => :app do
    run "df -h /"
  end

  desc "Display amount of free and used memory in the system."
  task :free, :roles => :app do
    run "free -m"
  end
  
  desc "Display the local environmental variables"
  task :env, :roles => :app do
    run "env"
  end
end

namespace :db do
  desc "Imports fixtures folder"
  task :seed, :roles => :db do
    puts File.dirname(__FILE__)
    Dir.glob('./data/fixtures/*.json') do |fixture|
      system "mongoimport -h #{db_host} -u #{db_user} -p #{db_password} --file #{fixture} -vvv --db #{application} --collection #{fixture.split('/').last.split('.').first} --upsert --upsertFields name --jsonArray --stopOnError --type json"
    end
  end
end

before 'deploy:setup', 'deploy:create_deploy_to_with_sudo'
after 'deploy:setup', 'deploy:write_upstart_script'
