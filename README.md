# CommerceTools elastic.io component

> CommerceTools component template for the [elastic.io platform](http://www.elastic.io "elastic.io platform")

This is an open source component template for [CommerceTools](http://www.commercetools.com/en/), formerly known as Sphere.io which is developed specifically to run on [elastic.io platform](http://www.elastic.io "elastic.io platform"). You can clone it and change it as you wish. However, **if you plan to deploy it into [elastic.io platform](http://www.elastic.io "elastic.io platform") you must follow sets of instructions to succeed**.

> Please note that the component is still called **sphereio-api** but it is planned to be renamed soon. For a time being we keep the naming for a consistency with other integration flows that it is still being used.

## Before you Begin

Before you can deploy any code into our system **you must be a registered elastic.io platform user**. Please see our home page at [http://www.elastic.io](http://www.elastic.io) to learn how.

> Any attempt to deploy a code into our platform without a registration would be rejected.

After the registration and opening of the account you must **[upload your SSH Key](http://docs.elastic.io/docs/ssh-key)** into our platform.

> If you fail to upload you SSH Key you will get **permission denied** error during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it into our system. At this stage we suggest you to:
* [Create a team](http://docs.elastic.io/page/team-management) to work on your new component. This is not required but will be automatically created using random naming by our system so we suggest you name your team accordingly.
* [Create a repository](http://docs.elastic.io/page/repository-management) where your new component is going to *reside* inside the team that you have just created. For a simplicity you can name your repository **sphereio-component** or **sphereio**.

```bash
$ git clone https://github.com/elasticio/sphereio-component.git sphereio-component

$ cd sphereio-component
```
Now you can edit your version of **sphereio-component** and build your desired component. Or you can just ``PUSH``it into our system to see the process in action:

```bash
$ git remote add elasticio your-team@git.elastic.io:sphereio-component.git

$ git push elasticio master
```
Obviously the naming of your team and repository is entirely up-to you and if you do not put any corresponding naming our system will auto generate it for you but the naming might not entirely correspond to your project requirements.

To learn on how to use this component please check our [sphereio component documentation](http://docs.elastic.io/docs/sphereio).
