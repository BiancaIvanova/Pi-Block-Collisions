import java.math.BigDecimal;
import java.math.MathContext;
import java.util.Scanner;

// m1u1 + m2u2 = m1v1 + m2v2
// (v2 - v1) / (u1 - u2)
// v2 = v1 + (u2 - u1)
// m1u1 + m2u2 = m1v1 + m2(v1 + (u2 - u1))
// u1 = (m2v1 + m1v2) / (m1 + m2)

// u1 + m2u2 = v1 + m2v2
// v1 = u1 + m2u2 - m2v2    ONE

// v2 - v1 = u1 - u2
// v2 = u1 - u2 + v1    TWO
// v2 = u1 - u2 + u1 + m2u2 - m2v2
// v2 + m2v2 = u1 - u2 + u1 + m2u2
// v2(m2 + 1) = u1 - u2 + u1 + m2u2
// v2 = (u1 - u2 + u1 + m2u2) / (m2 + 1)
// v2 = (2u1 - u2 + m2u2) / (m2 + 1)

// v2 = (2u1 - u2 + m2u2) / (m2 + 1)    Equation for v2

public class Main
{
    void main()
    {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter n,");
        System.out.println("\twhere n = number of digits of pi to compute");
        System.out.println("\tand 100^(n-1) is the mass of the large block");

        int n = sc.nextInt();

        BigDecimal bigMass = BigDecimal.valueOf(Math.pow(100, n-1));
        BigDecimal smallMass = BigDecimal.valueOf(1);

        BigDecimal bigVelocity = BigDecimal.valueOf(-1);
        BigDecimal smallVelocity = BigDecimal.valueOf(0);

        int totalCollisions = 0;

        int collisionType = 1; // 1 = block/block collision, 2 = block/wall collision


        //while (!((bigVelocity >= 0) && (smallVelocity >= 0) && (bigVelocity > smallVelocity)))
        while (!((bigVelocity.compareTo(BigDecimal.ZERO) >= 0)
                && (smallVelocity.compareTo(BigDecimal.ZERO) >= 0)
                && (bigVelocity.compareTo(smallVelocity) > 0)))
        {
            if (collisionType == 1)
            {
                // Block/block collision
                //BigDecimal newSmallVelocity = (smallVelocity + 2*bigMass*bigVelocity - bigMass*smallVelocity) / (bigMass + 1);
                BigDecimal newSmallVelocity = (smallVelocity.add(bigVelocity.multiply(BigDecimal.TWO).multiply(bigMass))).subtract(bigMass.multiply(smallVelocity)).divide(bigMass.add(BigDecimal.ONE), new MathContext(20));
                //BigDecimal newBigVelocity = (2*smallVelocity - bigVelocity + bigMass*bigVelocity) / (bigMass + 1);
                BigDecimal newBigVelocity = (smallVelocity.multiply(BigDecimal.TWO)).subtract(bigVelocity).add(bigMass.multiply(bigVelocity)).divide(bigMass.add(BigDecimal.ONE), new MathContext(20));
                smallVelocity = newSmallVelocity;
                bigVelocity = newBigVelocity;

                collisionType = 2; // change collision type
            }
            else
            {
                // Block/wall collision
                smallVelocity = smallVelocity.multiply(BigDecimal.valueOf(-1));
                collisionType = 1; // change collision type
            }

            totalCollisions++;
        }

        System.out.println(totalCollisions);
    }
}
