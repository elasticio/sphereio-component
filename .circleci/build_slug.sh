echo "Building slug"
id=$(git archive $CIRCLE_BRANCH | docker run -e "NPM_CONFIG_PRODUCTION=false" -i -a stdin elasticio/appbuilder)
docker attach $id
RC=$?
if [ $RC -eq 0 ];then
  echo "Build ok."
else
  echo "Build failed"
  exit 1
fi
