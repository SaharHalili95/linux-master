// Real output recorded by tests/sandbox/record.sh or record-vm.sh. Do not edit by hand.
Object.assign(RECORDED, {
  "e-dev-ls": {"distro":"Ubuntu 24.04","cmd":"ls -l /dev/null /dev/zero /dev/urandom | awk '{print $1,$3,$5,$6,$NF}'","out":"crw-rw-rw- root 1, 3 /dev/null\ncrw-rw-rw- root 1, 9 /dev/urandom\ncrw-rw-rw- root 1, 5 /dev/zero\n"},
  "e-null-silent": {"distro":"Ubuntu 24.04","cmd":"ls /nope 2> /dev/null; echo \"done\"","out":"done\n"},
  "e-null-size": {"distro":"Ubuntu 24.04","cmd":"echo hello > /dev/null; wc -c < /dev/null","out":"0\n"},
  "e-os-alma": {"distro":"AlmaLinux 10","cmd":"grep -E \"^(NAME|VERSION_ID|ID_LIKE)=\" /etc/os-release","out":"NAME=\"AlmaLinux\"\nID_LIKE=\"rhel centos fedora\"\nVERSION_ID=\"10.2\"\n"},
  "e-os-ubuntu": {"distro":"Ubuntu 24.04","cmd":"grep -E \"^(NAME|VERSION_ID|ID_LIKE)=\" /etc/os-release","out":"NAME=\"Ubuntu\"\nVERSION_ID=\"24.04\"\nID_LIKE=debian\n"},
  "e-tmp-dirs": {"distro":"Ubuntu 24.04","cmd":"ls -ld /tmp /var/tmp | awk '{print $1,$3,$NF}'","out":"drwxrwxrwt root /tmp\ndrwxrwxrwt root /var/tmp\n"},
  "e-urandom-count": {"distro":"Ubuntu 24.04","cmd":"head -c 16 /dev/urandom | wc -c","out":"16\n"},
  "e-zero": {"distro":"Ubuntu 24.04","cmd":"head -c 8 /dev/zero | od -An -tx1","out":" 00 00 00 00 00 00 00 00\n"},
});
