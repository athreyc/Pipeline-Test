package tutorial;
import edu.umd.cs.findbugs.BugInstance;
import edu.umd.cs.findbugs.BugReporter;
import edu.umd.cs.findbugs.bcel.OpcodeStackDetector;
import edu.umd.cs.findbugs.classfile.ClassDescriptor;
import edu.umd.cs.findbugs.classfile.FieldDescriptor;


public class CallToSystemOutPrintlnDetector2 extends OpcodeStackDetector 
{

    private BugReporter bugReporter;


    public CallToSystemOutPrintlnDetector2(BugReporter bugReporter)
    {
        super();
        this.bugReporter = bugReporter;
     }


    public void sawOpcode(int seen) 
    {
        if (seen == GETSTATIC)
        {

            try 
            {
                FieldDescriptor operand = getFieldDescriptorOperand();
                ClassDescriptor classDescriptor = operand.getClassDescriptor();
                if ("java/lang/System".equals(classDescriptor.getClassName()) && 
                        ("err".equals(operand.getName())||"out".equals(operand.getName()))) 
                {
                    reportBug();
                }
            } 
            catch (Exception e)
            {
            
            }

            
         }
    }

    private void reportBug()
    {
        this.bugReporter.reportBug(getBugInstance());
    }


    private BugInstance getBugInstance() 
    {
        	return new BugInstance(this, "TUTORIAL_BUG", NORMAL_PRIORITY).addClassAndMethod(this).addSourceLine(this);
    }
}