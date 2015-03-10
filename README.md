### Test section
For this milestone, files (JavaScript) used in the classroom workshop for test generation have been reused along with a simple Java program for analysis section.

The relevant tools and plugins used for testing are:
<ul>
<li> AWS Ubuntu instance - For running environment </li>
<li> Mocha - For unit testing </li> 
<li> Istanbul - For coverage analysis </li>
<li> Findbugs - For static analysis </li>
<li> HTML publisher plugin on Jenkins - For reporting </li>
</ul>

Note: Much of the testing and analysis functionalities (Success/Failure) are intiated via pre-build scripts on Jenkins. Only the relevant reports are generated and displayed by Jenkins.

After setting up the Jenkins server, the following steps were done to configure the build:

<ol>
<li> Create a Freestyle project and use the SSH clone repo URL to link the project to the GitHub project </li>
<li> Use the pre-build shell scripts as in the Jenkins file to install mocha, istanbul and nodejs </li>
<li> Furthermore, specify the mocha script in package.json file for the project to use -R doc option for the report file </li>
<li> Use the HTML publisher plugin on Jenkins job config page to specify the paths of the HTML file for mocha output </li>
<li> Using the same step, specify the HTML file path for the coverage produced by istanbul (in /coverage/lcov-report dir) </li>
<li> Finally, use the FindBugs command line option to produce the report in a desired o/p file using -html -output options Please see findbugs-introcs script for this</li>
<li> To fail the build when a Mocha unit test fails, the pre-build script would return a non-zero value effectively failing the build process </li>

</ol>

### Analysis section

To showcase analysis, FindBugs has been used to catch some static analysis bugs in the sample HelloWorld Java program.  
This requires the following steps:

<ol>
<li> Create a findbugs.xml file to specify which bug patterns to report and whcih ones to ignore. Please see the used file in the repo </li>
<li> Run the findbugs program using the CLI on the compiled HelloWorld.class. This is done via the script (See Jenkins config file) following instructions in <a href="url">http://algs4.cs.princeton.edu/windows/</a> </li>
<li> The findbugs program would report the warnings as per the xml file specification </li>
<li> For extending FindBugs, a custom detector plugin that reports usage of System.out in the program was developed as per the instructions in <a href="url">https://code.google.com/p/findbugs/wiki/DetectorPluginTutorial</a> </li>
<li> Using the jar file as prepared from the previous step, the findbugs program is run again on the HelloWorld.class to fail build process if this custom detector detects a problem </li>
</ol>

Note: On Jenkins, failing the build due to analysis was not done due to issue I ran into for findbugs-maven-plugin (although this was achieved successfully on an Eclipse build (Windows)). Hence, only reporting of errors is shown in the screenshots.  





