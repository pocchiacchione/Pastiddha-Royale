# Unisce js/*.js e index.html in un unico file (bundle.html); gli script https:// restano esterni
import re
h=open('index.html').read()
open('bundle.html','w').write(re.sub(r'<script src="(?!https?:)(.*?)"></script>',lambda m:'<script>'+open(m.group(1)).read()+'</script>',h))
